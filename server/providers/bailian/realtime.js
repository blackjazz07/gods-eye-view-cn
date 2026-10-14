import { enforceRateLimit, bailianRateLimiter } from './rate-limit.js';
import {
  resolveVoiceModel,
  isKnownVoiceTier,
} from '../../../src/voice/voiceCost.js';
import {
  DASHSCOPE_REALTIME_MODEL_MINI_DEFAULT,
  DASHSCOPE_REALTIME_MODEL_DEFAULT,
  DASHSCOPE_REALTIME_VOICE_DEFAULT,
  DASHSCOPE_REGION_DEFAULT,
  DASHSCOPE_REALTIME_TRANSCRIBE_MODEL_DEFAULT,
} from './constants.js';
import { realtimeInstructions } from './instructions.js';
import { GEV_REALTIME_TOOLS, toBailianTools } from './tools.js';
import { readRequestBody } from '../common/request.js';
import {
  DEFAULT_MAX_MESSAGE_SIZE,
  maxMessageSizeFromSdp,
} from '../../../src/voice/dataChannelBudget.js';

const SDP_BODY_MAX_BYTES = 256 * 1024;

function requestQuery(req) {
  try {
    return new URL(req.url || '', 'http://localhost').searchParams;
  } catch {
    return new URLSearchParams();
  }
}

function resolveApiKey(environment = process.env) {
  return environment.DASHSCOPE_API_KEY;
}

/**
 * The workspace-scoped WebRTC SDP endpoint. Bailian rejects cross-origin
 * browser SDP requests (CORS), so this server proxies the exchange and keeps
 * the API key server-side.
 */
function resolveRealtimeEndpoint({ environment = process.env, model }) {
  const workspaceId = String(environment.DASHSCOPE_WORKSPACE_ID || '').trim();
  if (!workspaceId) throw new Error('DASHSCOPE_WORKSPACE_ID is not set');
  const region = environment.DASHSCOPE_REGION || DASHSCOPE_REGION_DEFAULT;
  return `https://${workspaceId}.${region}.maas.aliyuncs.com/api/v1/webrtc/realtime?model=${encodeURIComponent(model)}`;
}

function resolveModel(tier, { models = {}, environment = process.env }) {
  return tier === 'mini'
    ? models.mini ||
        environment.DASHSCOPE_REALTIME_MODEL_MINI ||
        DASHSCOPE_REALTIME_MODEL_MINI_DEFAULT
    : models.standard ||
        environment.DASHSCOPE_REALTIME_MODEL ||
        DASHSCOPE_REALTIME_MODEL_DEFAULT;
}

/**
 * Build the `session` object the browser sends as a `session.update` event.
 * Bailian has no ephemeral client-secret mint step, so the config that OpenAI
 * would have embedded server-side is returned to the browser here instead.
 */
function buildSessionConfig({
  annotationGuidance,
  models = {},
  tools = GEV_REALTIME_TOOLS,
  tier = 'standard',
  environment = process.env,
}) {
  const model = resolveModel(tier, { models, environment });
  const voice =
    environment.DASHSCOPE_REALTIME_VOICE || DASHSCOPE_REALTIME_VOICE_DEFAULT;
  const transcribeModel =
    environment.DASHSCOPE_REALTIME_TRANSCRIBE_MODEL ||
    DASHSCOPE_REALTIME_TRANSCRIBE_MODEL_DEFAULT;

  const session = {
    modalities: ['text', 'audio'],
    instructions: realtimeInstructions(annotationGuidance),
    voice,
    // Qwen-Omni realtime session.update uses the FLAT PCM format fields (16 kHz
    // input / 24 kHz output). The nested `audio` object is the OpenAI-Realtime
    // layout and is not what Bailian's session.update accepts.
    input_audio_format: 'pcm',
    output_audio_format: 'pcm',
    // WebRTC supports only server-side VAD (no manual turn_detection: null).
    turn_detection: {
      type: 'server_vad',
      threshold: 0.5,
      silence_duration_ms: 800,
    },
    tools: toBailianTools(tools),
  };
  const transcriptionEnabled = transcribeModel.toLowerCase() !== 'off';
  if (transcriptionEnabled) {
    session.input_audio_transcription = { model: transcribeModel };
  }
  return {
    session,
    model,
    voice,
    transcribeModel: transcriptionEnabled ? transcribeModel : 'off',
  };
}

/**
 * GET /api/realtime/session — returns the Bailian `session.update` config.
 * The browser applies it over the data channel and waits for `session.updated`.
 */
function createRealtimeSessionHandler({
  annotationGuidance,
  models = {},
  tools = GEV_REALTIME_TOOLS,
  environment = process.env,
} = {}) {
  return (req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Content-Type', 'application/json');
    if (req.method !== 'GET') {
      res.statusCode = 405;
      res.end(JSON.stringify({ error: 'Method not allowed' }));
      return;
    }
    const apiKey = resolveApiKey(environment);
    if (!apiKey) {
      res.statusCode = 503;
      res.end(JSON.stringify({ error: 'DASHSCOPE_API_KEY is not set' }));
      return;
    }
    if (!enforceRateLimit(bailianRateLimiter(), req, res)) return;

    const query = requestQuery(req);
    const requestedTier = query.get('tier');
    const { tier } = resolveVoiceModel(requestedTier);
    const config = buildSessionConfig({
      annotationGuidance,
      models,
      tools,
      tier,
      environment,
    });
    res.setHeader('X-GEV-Voice-Tier', tier);
    res.setHeader('X-GEV-Voice-Model', config.model);
    res.setHeader('X-GEV-Voice-Transcribe-Model', config.transcribeModel);
    if (requestedTier && !isKnownVoiceTier(requestedTier)) {
      res.setHeader('X-GEV-Voice-Tier-Fallback', '1');
    }
    res.end(JSON.stringify(config));
  };
}

/**
 * POST /api/realtime/sdp — proxies the browser's Offer SDP to Bailian's
 * WebRTC endpoint and returns the Answer SDP. The model may be pinned with
 * `?model=…`, otherwise it follows `?tier=`.
 */
function createRealtimeSdpHandler({
  models = {},
  environment = process.env,
  fetchImpl = (...args) => fetch(...args),
} = {}) {
  return async (req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    if (req.method !== 'POST') {
      res.statusCode = 405;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Method not allowed' }));
      return;
    }
    const apiKey = resolveApiKey(environment);
    if (!apiKey) {
      res.statusCode = 503;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'DASHSCOPE_API_KEY is not set' }));
      return;
    }
    if (!enforceRateLimit(bailianRateLimiter(), req, res)) return;

    const query = requestQuery(req);
    const model =
      query.get('model') ||
      resolveModel(resolveVoiceModel(query.get('tier')).tier, {
        models,
        environment,
      });

    let endpoint;
    try {
      endpoint = resolveRealtimeEndpoint({ environment, model });
    } catch (error) {
      res.statusCode = 503;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: error.message }));
      return;
    }

    try {
      const offerSdp = await readRequestBody(req, SDP_BODY_MAX_BYTES);
      const response = await fetchImpl(endpoint, {
        method: 'POST',
        redirect: 'error',
        signal: AbortSignal.timeout(30_000),
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/sdp',
        },
        body: offerSdp,
      });
      const answer = await response.text();
      if (response.ok) {
        // The byte ceiling for one data-channel message, which is what the
        // browser sizes its split `session.update` steps against (see
        // src/voice/realtimeConnection.js). Both sides of the negotiation are
        // printed because the attribute is easy to misread: the answer's value
        // governs what the browser may send, and its absence is not "no limit"
        // but the RFC 8841 default.
        const answerLimit = maxMessageSizeFromSdp(answer);
        const offerLimit = maxMessageSizeFromSdp(offerSdp);
        console.info(
          `[realtime-sdp] one data-channel message ≤ ${
            answerLimit || DEFAULT_MAX_MESSAGE_SIZE
          } B (answer a=max-message-size=${
            answerLimit || 'absent'
          }, offer=${offerLimit || 'absent'}; absent → RFC 8841 default) — session.update is split to fit`,
        );
      }
      if (!response.ok) {
        const detail = answer.slice(0, 800);
        console.warn(
          `[realtime-sdp] upstream HTTP ${response.status}: ${detail || '(empty body)'}`,
        );
        res.statusCode = response.status;
        res.setHeader('Content-Type', 'application/json');
        // Surface the upstream reason (model not enabled, bad workspace id,
        // region mismatch, etc.) so the browser can show it instead of the
        // generic "SDP failed" message. It is the caller's own account error.
        res.end(
          JSON.stringify({
            error: 'Failed to negotiate Realtime SDP',
            detail: detail || `upstream returned HTTP ${response.status}`,
          }),
        );
        return;
      }
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/sdp');
      res.end(answer);
    } catch {
      console.warn('[realtime-sdp] negotiation failed');
      res.statusCode = 502;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Failed to negotiate Realtime SDP' }));
    }
  };
}

export { createRealtimeSessionHandler, createRealtimeSdpHandler };
