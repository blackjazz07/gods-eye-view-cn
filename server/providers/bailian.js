import { defaultSourceRoot } from './common/source-root.js';
import { handleHudSummary } from './bailian/hud-summary.js';
import { createDebugLogHandler } from './bailian/debug-log.js';
import {
  createRealtimeSessionHandler,
  createRealtimeSdpHandler,
} from './bailian/realtime.js';
import { sameSiteGated } from './common/same-site.js';

/**
 * Vite plugin: Aliyun Bailian (DashScope) Realtime voice.
 *
 * Keeps the DashScope API key and Workspace ID server-side. The browser fetches
 * its session config (instructions, tools, voice) from /api/realtime/session
 * and proxies its WebRTC SDP offer through /api/realtime/sdp — Bailian's SDP
 * endpoint rejects cross-origin browser requests, so the exchange runs here.
 */
function bailianRealtimeProxy({
  sourceRoot = defaultSourceRoot,
  annotationGuidance,
  realtime = {},
} = {}) {
  function install(middlewares) {
    // Cost-bearing and log endpoints refuse cross-site browser requests
    // (see server/providers/common/same-site.js and SECURITY.md).
    middlewares.use(
      '/api/bailian/hud-summary',
      sameSiteGated(handleHudSummary),
    );

    middlewares.use(
      '/api/realtime/debug-log',
      sameSiteGated(createDebugLogHandler({ sourceRoot })),
    );

    middlewares.use(
      '/api/realtime/session',
      sameSiteGated(
        createRealtimeSessionHandler({ ...realtime, annotationGuidance }),
      ),
    );

    middlewares.use(
      '/api/realtime/sdp',
      sameSiteGated(createRealtimeSdpHandler(realtime)),
    );
  }

  return {
    name: 'bailian-realtime-proxy',
    configureServer(server) {
      install(server.middlewares);
    },
    configurePreviewServer(server) {
      install(server.middlewares);
    },
  };
}

export { bailianRealtimeProxy };
