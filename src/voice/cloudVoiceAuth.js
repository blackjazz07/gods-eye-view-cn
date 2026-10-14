// Bailian (DashScope) voice is API-key only — there is no OAuth path, unlike
// the former OpenAI/ChatGPT integration. The "cloud auth mode" surface is kept
// as a thin, always-'api-key' shim so the cost meter and key setup callers that
// still read it keep working without carrying dead OAuth logic.

export const CLOUD_VOICE_AUTH_MODES = Object.freeze(['api-key']);
export const DEFAULT_CLOUD_VOICE_AUTH_MODE = 'api-key';
export const CLOUD_VOICE_AUTH_STORAGE_KEY = 'godsEyeView.voice.cloudAuth';

function storageRef(storage) {
  if (storage) return storage;
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
}

/** Bailian is API-key only; any stored value normalizes back to 'api-key'. */
export function normalizeCloudVoiceAuthMode() {
  return DEFAULT_CLOUD_VOICE_AUTH_MODE;
}

export function readStoredCloudVoiceAuthMode() {
  return DEFAULT_CLOUD_VOICE_AUTH_MODE;
}

/** Best-effort no-op: there is nothing to toggle. */
export function writeStoredCloudVoiceAuthMode(mode) {
  try {
    storageRef()?.setItem(
      CLOUD_VOICE_AUTH_STORAGE_KEY,
      DEFAULT_CLOUD_VOICE_AUTH_MODE,
    );
  } catch {
    /* best effort */
  }
  return DEFAULT_CLOUD_VOICE_AUTH_MODE;
}
