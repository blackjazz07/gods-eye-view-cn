import { makeCostRateLimiter, clientKey } from '../common/rate-limit.js';

/**
 * Requests/min/IP applied when GEV_RATELIMIT_BAILIAN_PER_MIN is unset. The HUD
 * asks for a summary every 15s (4/min) and a voice session makes one session
 * config request plus one SDP exchange, so the cap clears ordinary use several
 * times over and bites only a caller working the endpoint far harder than the
 * app does.
 */
const BAILIAN_DEFAULT_PER_MIN = 30;

// Built LAZILY on first request, NOT at module load (see the common rate-limit
// note): .env values are applied to process.env after this module is imported.
let _bailianRateLimiter;

/** Bailian cost endpoints (realtime/session + realtime/sdp + hud-summary). */
function bailianRateLimiter() {
  if (_bailianRateLimiter === undefined)
    _bailianRateLimiter = makeCostRateLimiter(
      process.env.GEV_RATELIMIT_BAILIAN_PER_MIN,
      BAILIAN_DEFAULT_PER_MIN,
    );
  return _bailianRateLimiter;
}

/**
 * Apply the limiter to a request, writing a 429 when over the cap.
 * When `limiter` is null — the explicit `0` opt-out — this is a no-op
 * returning `true`, so the handler proceeds unthrottled.
 *
 * @param {((key:string)=>boolean)|null} limiter
 * @param {import('http').IncomingMessage} req
 * @param {import('http').ServerResponse} res
 * @returns {boolean} True if the request may proceed; false if a 429 was sent.
 */
function enforceRateLimit(limiter, req, res) {
  if (!limiter) return true; // explicit 0 opt-out — unthrottled
  if (limiter(clientKey(req))) return true;
  res.statusCode = 429;
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Retry-After', '5');
  res.end(JSON.stringify({ error: 'Rate limit exceeded' }));
  return false;
}

export { enforceRateLimit, bailianRateLimiter, BAILIAN_DEFAULT_PER_MIN };
