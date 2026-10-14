import {
  HUD_SUMMARY_INSTRUCTIONS,
  keylessHudSummaryResponse,
} from '../../../src/hudSummaryResponse.js';
import { enforceRateLimit, bailianRateLimiter } from './rate-limit.js';
import { readRequestBody } from '../common/request.js';
import {
  DASHSCOPE_HUD_SUMMARY_MODEL_DEFAULT,
  DASHSCOPE_HUD_SUMMARY_ENDPOINT_DEFAULT,
} from './constants.js';

/** Pull the assistant text out of a Chat Completions response body. */
function extractChatCompletionsText(data) {
  return String(data?.choices?.[0]?.message?.content || '').trim();
}

function toFiveWordHudSummary(value) {
  return String(value || '')
    .replace(/[^\p{L}\p{N}\s-]/gu, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 5)
    .join(' ');
}

async function handleHudSummary(req, res) {
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Method not allowed' }));
    return;
  }

  const apiKey = process.env.DASHSCOPE_API_KEY;
  const keyless = keylessHudSummaryResponse(apiKey);
  if (keyless) {
    res.statusCode = keyless.statusCode;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    res.end(JSON.stringify(keyless.payload));
    return;
  }

  // Per-IP throttle (GEV_RATELIMIT_BAILIAN_PER_MIN). On by default; 0 disables.
  if (!enforceRateLimit(bailianRateLimiter(), req, res)) return;

  try {
    const body = await readRequestBody(req, 64 * 1024);
    const context = JSON.parse(body || '{}');
    const response = await fetch(
      process.env.DASHSCOPE_HUD_SUMMARY_ENDPOINT ||
        DASHSCOPE_HUD_SUMMARY_ENDPOINT_DEFAULT,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model:
            process.env.DASHSCOPE_HUD_SUMMARY_MODEL ||
            DASHSCOPE_HUD_SUMMARY_MODEL_DEFAULT,
          messages: [
            { role: 'system', content: HUD_SUMMARY_INSTRUCTIONS },
            { role: 'user', content: JSON.stringify(context) },
          ],
          max_tokens: 100,
        }),
      },
    );
    const data = await response.json().catch(() => ({}));
    const summary = toFiveWordHudSummary(extractChatCompletionsText(data));
    res.statusCode = response.ok && summary ? 200 : response.status || 502;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    if (!response.ok)
      console.warn(`[hud-summary] upstream HTTP ${response.status}`);
    res.end(
      JSON.stringify({
        summary: summary || null,
        // Never relay `data.error.message`: it carries request ids and quota
        // phrasing from the upstream provider.
        error: response.ok ? null : 'Bailian HUD summary request failed',
      }),
    );
  } catch {
    console.warn('[hud-summary] request failed');
    res.statusCode = 502;
    res.setHeader('Content-Type', 'application/json');
    res.end(
      JSON.stringify({
        error: 'Bailian HUD summary request failed',
      }),
    );
  }
}

export { handleHudSummary };
