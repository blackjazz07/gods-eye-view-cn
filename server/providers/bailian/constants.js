import { VOICE_MODELS } from '../../../src/voice/voiceCost.js';

// Sourced from the shared voice-model registry so the client's cost estimate
// can never be computed against a different model than the session runs on.
const DASHSCOPE_REALTIME_MODEL_DEFAULT = VOICE_MODELS.standard.id;

const DASHSCOPE_REALTIME_MODEL_MINI_DEFAULT = VOICE_MODELS.mini.id;

// Bailian realtime default voice (Qwen3.8-Omni-Flash-Realtime defaults to Tina).
const DASHSCOPE_REALTIME_VOICE_DEFAULT = 'Tina';

// Region for the workspace-scoped WebRTC SDP endpoint.
const DASHSCOPE_REGION_DEFAULT = 'cn-beijing';

// Input transcription model for voice-card captions; "off" disables it.
const DASHSCOPE_REALTIME_TRANSCRIBE_MODEL_DEFAULT = 'qwen3-asr-flash-realtime';

// HUD summary runs through Bailian's OpenAI-compatible Chat Completions.
const DASHSCOPE_HUD_SUMMARY_MODEL_DEFAULT = 'qwen-flash';

const DASHSCOPE_HUD_SUMMARY_ENDPOINT_DEFAULT =
  'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions';

export {
  DASHSCOPE_HUD_SUMMARY_MODEL_DEFAULT,
  DASHSCOPE_HUD_SUMMARY_ENDPOINT_DEFAULT,
  DASHSCOPE_REALTIME_MODEL_MINI_DEFAULT,
  DASHSCOPE_REALTIME_MODEL_DEFAULT,
  DASHSCOPE_REALTIME_VOICE_DEFAULT,
  DASHSCOPE_REGION_DEFAULT,
  DASHSCOPE_REALTIME_TRANSCRIBE_MODEL_DEFAULT,
};
