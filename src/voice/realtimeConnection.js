import { resolveDataChannelBudget } from './dataChannelBudget.js';

const DISCONNECT_GRACE_MS = 6000;

/**
 * Wait for ICE candidate gathering to finish, then return the LOCAL offer SDP
 * (read from pc.localDescription, which the browser re-writes as candidates
 * arrive). Bailian's SDP exchange is a single HTTP round-trip with no trickle
 * ICE, so the offer it receives MUST already carry every candidate — the raw
 * `createOffer()` result (offer.sdp) predates gathering and has none, which
 * makes the upstream reject the exchange with HTTP 400.
 */
function waitForIceGathering(pc, signal, timeoutMs = 5000) {
  return new Promise((resolve, reject) => {
    let settled = false;
    let timer;
    const onAbort = () => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      reject(new DOMException('Aborted', 'AbortError'));
    };
    const finish = () => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      signal?.removeEventListener('abort', onAbort);
      resolve(pc.localDescription?.sdp ?? '');
    };
    timer = setTimeout(finish, timeoutMs);
    pc.addEventListener('icegatheringstatechange', () => {
      if (pc.iceGatheringState === 'complete') finish();
    });
    signal?.addEventListener('abort', onAbort, { once: true });
  });
}

/**
 * Normalize SDP line endings to CRLF, as the WebRTC SDP grammar requires.
 * Bailian's Answer SDP can arrive with bare LF, which some browsers reject in
 * setRemoteDescription. Trailing CRLF is also guaranteed.
 */
function normalizeSdpForSetRemote(sdp) {
  sdp = String(sdp ?? '')
    .trim()
    .replace(/\r?\n/g, '\r\n');
  return sdp.endsWith('\r\n') ? sdp : `${sdp}\r\n`;
}

// A single `session.update` cannot carry the whole GEV config. Instructions plus
// 30 tool schemas is ~72 KB of UTF-8, and a WebRTC data channel refuses any
// message above the SCTP max-message-size its peer advertised (measured in the
// field: the answer carried `a=max-message-size:65536`, and the two halves
// themselves — 20.9 KB of config, 51.8 KB of tools — each fit under it while the
// pair together did not). The rejected send was what left the model with no
// tools at all — voice recognition kept working while every spoken command did
// nothing.
//
// So the config is split across several `session.update` events (the server
// leaves fields an event omits untouched, so this is equivalent to one event),
// and the tool list degrades in steps, largest payload first, so the session
// always ends up with as many tools as the channel will carry.
const TOOL_DESCRIPTION_LIMIT = 160;

/** UTF-8 byte length — data-channel budgets are byte counts, not char counts. */
function utf8ByteLength(text) {
  return typeof TextEncoder === 'function'
    ? new TextEncoder().encode(text).byteLength
    : text.length;
}

/** Shortens each tool's own description, keeping every argument description. */
function truncateToolDescriptions(tools, limit = TOOL_DESCRIPTION_LIMIT) {
  return tools.map((tool) => {
    const text = tool?.function?.description;
    if (typeof text !== 'string' || text.length <= limit) return tool;
    const cut = text.slice(0, limit).replace(/[\s,;:.]+$/, '');
    return { ...tool, function: { ...tool.function, description: `${cut}…` } };
  });
}

/**
 * Drops every per-argument `description`, keeping tool names, parameter names,
 * types, enums and required lists. Costs some argument accuracy, but keeps all
 * tools callable and lands the payload smaller than the non-tool config — which
 * is the size we know the channel accepts.
 */
function stripArgumentDescriptions(node) {
  if (Array.isArray(node)) return node.map(stripArgumentDescriptions);
  if (!node || typeof node !== 'object') return node;
  const out = {};
  for (const [key, value] of Object.entries(node)) {
    if (key === 'description') continue;
    out[key] = stripArgumentDescriptions(value);
  }
  return out;
}

function compactToolSchemas(tools) {
  return tools.map((tool) => ({
    ...tool,
    function: {
      ...tool.function,
      parameters: stripArgumentDescriptions(tool.function?.parameters),
    },
  }));
}

/**
 * The `session.update` events to send, in order: the non-tool config first and
 * alone, then the tool list, largest payload first. Callers walk the tool steps
 * in order and stop at the first one the channel accepts.
 */
function sessionUpdatePlan(session) {
  const { tools, ...config } = session ?? {};
  const plan = [
    { label: 'config', carriesTools: false, session: config },
    // Last resort when even the config above will not fit: keeps the session
    // usable (voice, formats, VAD, transcription) without its instructions.
    {
      label: 'config-minimal',
      carriesTools: false,
      session: {
        modalities: config.modalities,
        voice: config.voice,
        input_audio_format: config.input_audio_format,
        output_audio_format: config.output_audio_format,
        turn_detection: config.turn_detection,
        input_audio_transcription: config.input_audio_transcription,
      },
    },
  ];
  if (!Array.isArray(tools) || !tools.length) return plan;
  for (const [label, list] of [
    ['tools', tools],
    ['tools-truncated', truncateToolDescriptions(tools)],
    ['tools-compact', compactToolSchemas(tools)],
  ]) {
    plan.push({ label, carriesTools: true, session: { tools: list } });
  }
  return plan;
}

function releaseStartResources({ localStream = null, localPc = null } = {}) {
  if (localStream) {
    try {
      localStream.getTracks().forEach((track) => track.stop());
    } catch {
      /* no-op */
    }
  }
  if (localPc) {
    try {
      localPc.close();
    } catch {
      /* no-op */
    }
  }
}
/** Own connection generations, negotiated transport and acquired media resources. */
export class RealtimeConnection {
  constructor({
    readLifetimeSignal,
    readBackend,
    readStatus,
    input,
    cost,
    operations,
  }) {
    Object.assign(
      this,
      { readLifetimeSignal, readBackend, readStatus, input, cost },
      operations,
    );
    this.connectionAbort = null;
    this.pc = null;
    this.dc = null;
    this.stream = null;
    this.audioEl = null;
    this.startEpoch = 0;
    this.disconnectGraceTimer = null;
    this._tearingDown = false;
  }
  get lifetimeSignal() {
    return this.readLifetimeSignal();
  }
  get backend() {
    return this.readBackend();
  }
  get status() {
    return this.readStatus();
  }
  async start({ pushToTalk = false } = {}) {
    if (this.isActive() || this.lifetimeSignal?.aborted) return;
    this.pauseRadioForVoice();
    const pushToTalkKeyHeld = pushToTalk && this.input.pushToTalkKeyHeld;
    const spaceKeyHeld = this.input.spaceKeyHeld;
    this.stop({ preserveStatus: true });
    this.input.pushToTalkMode = pushToTalk;
    this.input.pushToTalkKeyHeld = pushToTalkKeyHeld;
    this.input.spaceKeyHeld = spaceKeyHeld;
    if (!window.RTCPeerConnection || !navigator.mediaDevices?.getUserMedia) {
      this.setStatus('error', 'WebRTC microphone support unavailable');
      return;
    }

    // Claim this connect attempt. stop() (and any later start()) bump startEpoch,
    // so `epoch !== this.startEpoch` after any await means we were superseded and
    // must abandon this attempt, releasing whatever it already acquired (H7).
    if (this.lifetimeSignal?.aborted) return;
    const epoch = ++this.startEpoch;
    this.connectionAbort?.abort();
    this.connectionAbort = new AbortController();
    const signal = AbortSignal.any(
      [this.connectionAbort.signal, this.lifetimeSignal].filter(Boolean),
    );
    // A new session is a new meter. Re-read tier + limits so a toggle made
    // while the last session ran (or in another tab) takes effect exactly here
    // — this is what "applies next session" means.
    this.cost.prepareSession();
    this.syncCostUi();
    this.setStatus('connecting', '正在请求麦克风');
    this.debugLog('session.starting', {
      epoch,
      tier: this.cost.voiceTier,
      connection: this.connectionDiagnostics(),
    });
    let localStream = null;
    let localPc = null;
    try {
      // 1. Fetch the session.update config. Bailian has no ephemeral
      // client-secret mint step; the browser applies this config over the data
      // channel itself after the connection is established.
      const sessionInfo = await this.backend.requestSession({
        tier: this.cost.voiceTier,
        signal,
      });
      if (this.abandonStart(epoch, { localStream, localPc })) return;
      // Bind the session meter to the model actually served. An env override
      // (DASHSCOPE_REALTIME_MODEL[_MINI]) can point a tier at a different model,
      // and pricing by the tier we asked for would then under-meter and let the
      // cap be overrun. Unrecognised ids bill at worst-case rates.
      const costState = this.cost.bindServedModel(sessionInfo.model);
      this.cost.bindTranscriptionModel?.(sessionInfo.transcribeModel);
      if (!costState.ratesRecognized) {
        console.warn(
          `[GEV voice] unrecognised Realtime model "${costState.modelId}" — ` +
            'billing this session at the most expensive known rates. Update the ' +
            'rate table in src/voice/voiceCost.js.',
        );
      }
      this.syncCostUi();
      this.debugLog('session.config.ready', {
        servedModel: sessionInfo.model || null,
        servedTier: sessionInfo.tier || null,
        ratesRecognized: costState.ratesRecognized,
      });

      // 2. Acquire the microphone now: Bailian requires the audio track to be
      // present in the Offer SDP (m=audio). It stays gated (muted) until the
      // server announces `session.created`, then we release it below.
      localStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          channelCount: 1,
        },
      });
      if (this.abandonStart(epoch, { localStream, localPc })) return;
      this.stream = localStream;

      document
        .querySelectorAll('audio[data-gev-realtime-audio="true"]')
        .forEach((el) => el.remove());
      this.audioEl = document.createElement('audio');
      this.audioEl.autoplay = true;
      this.audioEl.dataset.gevRealtimeAudio = 'true';
      this.audioEl.style.display = 'none';
      document.body.appendChild(this.audioEl);

      // 3. Peer connection + remote audio + ICE lifecycle handlers.
      localPc = new RTCPeerConnection();
      this.pc = localPc;
      const ownsConnection = () =>
        epoch === this.startEpoch && this.pc === localPc && !signal.aborted;
      this.pc.ontrack = (event) => {
        if (!ownsConnection() || !this.audioEl) return;
        const remoteStream = event.streams[0];
        this.audioEl.srcObject = remoteStream;
        this.startAssistantVoiceVisualizer(remoteStream);
      };
      this.pc.onconnectionstatechange = () => {
        if (ownsConnection()) this.handleConnectionStateChange();
      };
      this.pc.oniceconnectionstatechange = () => {
        if (ownsConnection() && this.pc?.iceConnectionState === 'failed') {
          this.fatalError('ICE connection', null, this.connectionDiagnostics());
        }
      };
      this.pc.onicecandidateerror = (event) => {
        if (!ownsConnection()) return;
        this.reportError('ICE candidate', event, {
          errorCode: event.errorCode,
          errorText: event.errorText,
          address: event.address,
          port: event.port,
          url: event.url,
          ...this.connectionDiagnostics(),
        });
      };

      // 4. Add the mic track to the Offer, gated muted until session.created.
      this.stream.getTracks().forEach((track) => {
        track.enabled = false;
        this.pc.addTrack(track, this.stream);
      });

      // 5. Client → server control channel ('oai-events'). Per Bailian's
      // WebRTC protocol this client-created channel ONLY triggers SDP
      // data-channel negotiation — the server does not read events from it.
      // All real event traffic (both directions) runs on the channel the
      // server creates, named 'txt'; `this.dc` is repointed to it in step 6.
      const dataChannel = this.pc.createDataChannel('oai-events');
      this.dc = dataChannel;
      const ownsChannel = () => ownsConnection() && !this._tearingDown;
      dataChannel.addEventListener('error', (event) => {
        if (this._tearingDown || !ownsChannel()) return;
        this.fatalError(
          'Realtime data channel',
          event,
          this.connectionDiagnostics(dataChannel),
        );
      });
      dataChannel.addEventListener('close', () => {
        if (this._tearingDown || !ownsChannel()) return;
        if (
          this.dc === dataChannel &&
          this.status !== 'idle' &&
          this.status !== 'error'
        ) {
          this.fatalError(
            'Realtime data channel closed',
            null,
            this.connectionDiagnostics(dataChannel),
          );
        }
      });

      // Handshake. Bailian pushes `session.created` on one of the data channels
      // (client-created 'oai-events' OR the server's own channel), and per the
      // official demo the client must reply `session.update` on THAT SAME
      // channel. Crucially the mic gate is released on `session.created` — the
      // demo never blocks on `session.updated`, which may be delayed or omitted,
      // so neither do we. We keep listening for `session.updated` (non-blocking)
      // and `error` (fail fast) purely for diagnostics.
      const handshake = { created: false, updated: false, updateSent: false };
      let resolveReady;
      let rejectReady;
      const sessionReady = new Promise((resolve, reject) => {
        resolveReady = resolve;
        rejectReady = reject;
      });
      // Never leak an unhandled rejection if a superseded attempt bails before
      // awaiting this promise.
      sessionReady.catch(() => {});
      handshake.timer = setTimeout(
        () =>
          rejectReady(
            new Error(
              handshake.created
                ? 'Realtime session handshake timed out after session.created'
                : 'Realtime session handshake timed out — the server never sent session.created',
            ),
          ),
        15_000,
      );
      handshake.onAbort = () =>
        rejectReady(new Error('Realtime session aborted before ready'));
      signal.addEventListener('abort', handshake.onAbort, { once: true });
      const settleHandshake = () => {
        clearTimeout(handshake.timer);
        signal.removeEventListener('abort', handshake.onAbort);
        resolveReady();
      };

      const sendUpdateOn = (channel) => {
        if (handshake.updateSent) return;
        if (!channel || channel.readyState !== 'open') return;
        handshake.updateSent = true;
        const budget = this.readChannelBudget(channel);
        const plan = sessionUpdatePlan(sessionInfo.session);
        // Which ceiling the split was measured against, and how we learned it.
        // The server logs the same figure from the answer SDP it proxied, so
        // the two together say whether a degraded tool list was caused by the
        // negotiated channel or by a payload that simply grew too large.
        this.debugLog('client.session.budget', {
          budget: budget.bytes,
          source: budget.source,
          channel: channel.label || null,
        });
        // The config lands first: only then does the session carry its
        // instructions, voice and VAD settings.
        let configSent = false;
        for (const step of plan.filter((entry) => !entry.carriesTools)) {
          if (this.sendSessionStep(channel, step, budget.bytes)) {
            configSent = true;
            break;
          }
        }
        if (!configSent) return;
        for (const step of plan.filter((entry) => entry.carriesTools)) {
          if (this.sendSessionStep(channel, step, budget.bytes)) return;
        }
        // Nothing went out: the session keeps running on the server's defaults,
        // which is the "recognition works, commands do nothing" state. Say so
        // loudly instead of letting it look like a healthy session.
        this.debugLog('client.session.tools.failed', {
          channel: channel.label || null,
          budget: budget.bytes,
          budgetSource: budget.source,
          attempted: plan
            .filter((entry) => entry.carriesTools)
            .map((entry) => entry.label),
        });
      };

      const handleServerMessage = (msg, channel) => {
        if (!ownsChannel()) return;
        let payload = null;
        try {
          payload = JSON.parse(msg.data);
        } catch {
          /* non-JSON message — still hand it to the shared event handler */
        }
        if (payload?.type === 'session.created') {
          handshake.created = true;
          // The control channel is the one session.created arrived on — every
          // downstream client event (session.update, response.create, tool
          // outputs) must go back on it too.
          this.dc = channel;
          this.debugLog('server.session.created', {
            channel: channel?.label || null,
          });
          // Release the mic gate FIRST. A throw while applying the config below
          // must never strand the handshake — that produced a phantom 15s
          // "handshake timed out" on a session that was already working.
          settleHandshake();
          sendUpdateOn(channel);
        } else if (payload?.type === 'session.updated') {
          handshake.updated = true;
          this.debugLog('server.session.updated', {
            channel: channel?.label || null,
          });
        } else if (payload?.type === 'error') {
          // Bailian rejects a bad session.update with an `error` event. Fail
          // fast with the real reason instead of hanging to a timeout.
          const reason =
            payload?.error?.message ||
            payload?.error?.code ||
            payload?.error?.param ||
            'unknown server error';
          rejectReady(new Error(`Realtime session rejected: ${reason}`));
        }
        this.handleRealtimeEvent(msg);
      };
      dataChannel.addEventListener('message', (msg) =>
        handleServerMessage(msg, dataChannel),
      );
      dataChannel.addEventListener('open', () => {
        if (!ownsChannel()) return;
        this.debugLog('data_channel.open', {
          connection: this.connectionDiagnostics(dataChannel),
        });
      });

      // 6. The server may also push events on a channel it creates itself. Both
      // directions on both channels are handled identically; the control channel
      // is chosen by which one `session.created` arrives on (see above).
      this.pc.ondatachannel = (event) => {
        if (!ownsConnection()) return;
        const channel = event.channel;
        this.debugLog('server_channel.open', { label: channel.label || null });
        channel.addEventListener('message', (msg) =>
          handleServerMessage(msg, channel),
        );
        channel.addEventListener('error', () => {
          if (this._tearingDown || !ownsChannel()) return;
          this.fatalError(
            'Realtime server channel',
            null,
            this.connectionDiagnostics(channel),
          );
        });
        channel.addEventListener('close', () => {
          if (this._tearingDown || !ownsChannel()) return;
          if (
            this.dc === channel &&
            this.status !== 'idle' &&
            this.status !== 'error'
          ) {
            this.fatalError(
              'Realtime server channel closed',
              null,
              this.connectionDiagnostics(channel),
            );
          }
        });
      };

      // 7. SDP exchange (Offer → server proxy → Answer). Bailian needs the
      // complete ICE candidate set in the offer (no trickle ICE), so wait for
      // gathering to finish and send pc.localDescription.sdp, NOT the raw
      // createOffer() result — the latter has no candidates and makes the
      // upstream reject the exchange with HTTP 400.
      const offer = await localPc.createOffer();
      if (this.abandonStart(epoch, { localStream, localPc })) return;
      await localPc.setLocalDescription(offer);
      if (this.abandonStart(epoch, { localStream, localPc })) return;
      const offerSdp = await waitForIceGathering(localPc, signal);
      if (this.abandonStart(epoch, { localStream, localPc })) return;
      this.debugLog('webrtc.offer.created', {
        sdpLength: offerSdp?.length || 0,
        connection: this.connectionDiagnostics(),
      });
      const answerSdp = await this.backend.negotiate({
        offerSdp,
        model: sessionInfo.model,
        signal,
      });
      if (this.abandonStart(epoch, { localStream, localPc })) return;
      await localPc.setRemoteDescription({
        type: 'answer',
        sdp: normalizeSdpForSetRemote(answerSdp),
      });
      if (this.abandonStart(epoch, { localStream, localPc })) return;
      this.debugLog('webrtc.answer.applied', {
        connection: this.connectionDiagnostics(),
      });

      // 8. Wait for session.created, then release the mic gate. The gate was
      // closed while the audio track rode in the Offer SDP; it opens once the
      // server has acknowledged the session (per the official demo, this does
      // NOT wait for session.updated — that event is handled non-blockingly).
      await sessionReady;
      if (this.abandonStart(epoch, { localStream, localPc })) return;
      this.setMicrophoneEnabled(
        !this.input.pushToTalkMode || this.input.pushToTalkKeyHeld,
      );
      this.startVoiceVisualizer(localStream);
      const detail = this.input.pushToTalkMode
        ? this.input.pushToTalkKeyHeld
          ? 'Release Space to send'
          : 'Hold Space to talk'
        : 'Ask or command';
      this.setStatus('listening', detail);
      this.debugLog('session.ready', {
        connection: this.connectionDiagnostics(dataChannel),
      });
    } catch (error) {
      // A superseded attempt should die quietly — its resources are already
      // released by abandonStart / the newer start(), and surfacing its error
      // would clobber the live session's status (H7).
      if (epoch !== this.startEpoch) {
        releaseStartResources({ localStream, localPc });
        return;
      }
      const diagnostics = this.connectionDiagnostics();
      this.stop({ preserveStatus: true });
      this.reportError('Realtime connection', error, diagnostics);
    }
  }

  // Returns true (and tears down the just-acquired resources) when this start()
  // attempt has been superseded by a newer start()/stop() — the caller must
  // then `return` immediately without touching shared session state (H7).
  abandonStart(epoch, resources) {
    if (epoch === this.startEpoch) return false;
    // These resources may or may not have been promoted onto `this` yet. If a
    // stop() bumped the epoch it already tore down whatever was promoted; if a
    // *second* start() bumped it, that start owns `this.stream`/`this.pc` now,
    // so only null the refs that still point at OUR abandoned locals — never the
    // successor's. Then release the locals unconditionally (idempotent close).
    if (resources.localStream && this.stream === resources.localStream)
      this.stream = null;
    if (resources.localPc && this.pc === resources.localPc) {
      this.pc = null;
      this.dc = null;
    }
    releaseStartResources(resources);
    this.debugLog('session.start.abandoned', {
      epoch,
      currentEpoch: this.startEpoch,
    });
    return true;
  }

  // WebRTC connection-state transitions. 'failed' is a hard drop → fatal. But
  // 'disconnected' is often a momentary blip ICE recovers from on its own, so we
  // give it a grace window; only if it hasn't recovered do we escalate to fatal.
  // A recovery to 'connected'/'completed' cancels the pending escalation (H8).
  handleConnectionStateChange() {
    const state = this.pc?.connectionState;
    if (state === 'failed') {
      this.fatalError('WebRTC connection', null, this.connectionDiagnostics());
      return;
    }
    if (state === 'disconnected') {
      if (this.disconnectGraceTimer) return;
      this.debugLog('webrtc.disconnected.grace', {
        graceMs: DISCONNECT_GRACE_MS,
        connection: this.connectionDiagnostics(),
      });
      this.disconnectGraceTimer = setTimeout(() => {
        this.disconnectGraceTimer = null;
        // Still not recovered after the grace window → treat as a real drop.
        if (this.pc?.connectionState === 'disconnected') {
          this.fatalError(
            'WebRTC connection lost',
            null,
            this.connectionDiagnostics(),
          );
        }
      }, DISCONNECT_GRACE_MS);
      return;
    }
    if (state === 'connected' || state === 'completed') {
      // Recovered before the grace window elapsed — cancel the escalation.
      this.clearDisconnectGrace();
    }
  }

  clearDisconnectGrace() {
    if (this.disconnectGraceTimer) {
      clearTimeout(this.disconnectGraceTimer);
      this.disconnectGraceTimer = null;
    }
  }

  sendRealtimeEvent(message, logEventName = 'client.event') {
    if (!this.dc || this.dc.readyState !== 'open') return false;
    this.debugLog(logEventName, {
      type: message?.type || null,
      message,
    });
    // A dc.send() that exceeds the SCTP send-buffer / max message size throws.
    // If that throw escaped it would abort handleRealtimeEvent BEFORE
    // queueResponseCreate + setStatus('listening'), stranding the turn at
    // EXECUTING. Swallow it and signal failure so callers can fall through
    // without the offending payload (M13).
    try {
      this.dc.send(JSON.stringify(message));
      return true;
    } catch (error) {
      this.debugLog('client.send.failed', {
        logEventName,
        type: message?.type || null,
        error: error?.message || String(error),
      });
      return false;
    }
  }

  /**
   * The largest event this connection may send in one piece, plus where the
   * figure came from. The budget is never 0: an unknown negotiation resolves to
   * the RFC 8841 default, so the pre-flight check in `sendSessionStep` always
   * has a number to compare a payload against. It used to fall back to 0, which
   * silenced that check and let an oversized `session.update` go out and throw
   * — the "tools never arrived" failure the split exists to prevent.
   */
  readChannelBudget(channel) {
    return resolveDataChannelBudget({
      sctpMaxMessageSize: this.pc?.sctp?.maxMessageSize,
      dataChannelMaxMessageSize: channel?.maxMessageSize,
      remoteSdp: this.pc?.remoteDescription?.sdp,
    });
  }

  /**
   * Sends one `session.update` step. Returns false — after logging why — when
   * the payload exceeds the negotiated budget or the channel refuses it, so the
   * caller can walk on to the next, smaller step.
   */
  sendSessionStep(channel, step, budget) {
    const text = JSON.stringify({
      type: 'session.update',
      session: step.session,
    });
    const bytes = utf8ByteLength(text);
    if (budget && bytes > budget) {
      this.debugLog('client.session.update.skipped', {
        label: step.label,
        bytes,
        budget,
      });
      return false;
    }
    try {
      channel.send(text);
    } catch (error) {
      this.debugLog('client.session.update.failed', {
        label: step.label,
        bytes,
        budget: budget || null,
        error: error?.message || String(error),
      });
      return false;
    }
    this.debugLog('client.session.update', {
      label: step.label,
      bytes,
      budget: budget || null,
      channel: channel.label || null,
    });
    return true;
  }

  invalidate() {
    this.startEpoch++;
    this.connectionAbort?.abort();
    this.connectionAbort = null;
  }

  closeTransport() {
    if (this.dc) {
      try {
        this.dc.close();
      } catch {
        /* no-op */
      }
      this.dc = null;
    }
    if (this.pc) {
      try {
        this.pc.close();
      } catch {
        /* no-op */
      }
      this.pc = null;
    }
    this._tearingDown = false;
  }

  releaseMedia() {
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }
    if (this.audioEl) {
      this.audioEl.remove();
      this.audioEl = null;
    }
  }

  beginTeardown() {
    this._tearingDown = true;
  }
}
