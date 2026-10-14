import { DEFAULT_VOICE_TIER, resolveVoiceModel } from './voiceCost.js';

/** Bailian Realtime session-config and SDP requests, independent of mic/UI ownership. */
export function createRealtimeBackend({
  sessionEndpoint = '/api/realtime/session',
  sdpEndpoint = '/api/realtime/sdp',
  sessionTransport = (...args) => fetch(...args),
  connectionTransport = (...args) => fetch(...args),
  timeoutMs = 30_000,
  signal: lifetime,
} = {}) {
  const scoped = (signal) =>
    AbortSignal.any(
      [lifetime, signal, AbortSignal.timeout(timeoutMs)].filter(Boolean),
    );
  return Object.freeze({
    protocol: 'bailian-realtime',
    /**
     * Fetch the `session.update` config (instructions, tools, voice, audio
     * format) the browser applies over the data channel. Bailian has no
     * ephemeral client-secret mint step.
     */
    async requestSession({ tier = DEFAULT_VOICE_TIER, signal } = {}) {
      signal = scoped(signal);
      signal.throwIfAborted();
      const separator = sessionEndpoint.includes('?') ? '&' : '?';
      const query = new URLSearchParams({
        tier: resolveVoiceModel(tier).tier,
      });
      const url = `${sessionEndpoint}${separator}${query}`;
      const response = await sessionTransport(url, {
        signal,
        cache: 'no-store',
        redirect: 'error',
      });
      signal.throwIfAborted();
      const data = await response.json().catch(() => null);
      signal.throwIfAborted();
      if (!response.ok) {
        const reason =
          typeof data?.error === 'string' ? data.error : data?.error?.message;
        throw new Error(
          reason || `Realtime session config failed: HTTP ${response.status}`,
        );
      }
      const session = data?.session;
      if (!session || typeof session !== 'object')
        throw new Error(
          'Realtime session response did not include a session config',
        );
      return {
        session,
        model:
          response.headers?.get?.('X-GEV-Voice-Model') || data?.model || null,
        tier: response.headers?.get?.('X-GEV-Voice-Tier') || null,
        transcribeModel:
          response.headers?.get?.('X-GEV-Voice-Transcribe-Model') || null,
      };
    },
    /**
     * Proxy the Offer SDP through the server, which forwards it to Bailian's
     * WebRTC endpoint and returns the Answer SDP. The API key never reaches the
     * browser, so no Authorization header is set here.
     */
    async negotiate({ offerSdp, model, signal }) {
      signal = scoped(signal);
      signal.throwIfAborted();
      const query = new URLSearchParams();
      if (model) query.set('model', model);
      const separator = sdpEndpoint.includes('?') ? '&' : '?';
      const url = `${sdpEndpoint}${separator}${query}`;
      const response = await connectionTransport(url, {
        method: 'POST',
        body: offerSdp,
        signal,
        redirect: 'error',
        cache: 'no-store',
        headers: { 'Content-Type': 'application/sdp' },
      });
      signal.throwIfAborted();
      if (!response.ok) {
        const data = await response.json().catch(() => null);
        await response.body?.cancel?.().catch(() => {});
        const reason = data?.detail || data?.error;
        throw new Error(
          reason
            ? `Realtime SDP failed: HTTP ${response.status} (${reason})`
            : `Realtime SDP failed: HTTP ${response.status}`,
        );
      }
      const answer = await response.text();
      signal.throwIfAborted();
      return answer;
    },
  });
}
