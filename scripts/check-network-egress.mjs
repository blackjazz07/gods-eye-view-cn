#!/usr/bin/env node
/**
 * Answers exactly one question: can the process that will run the dev server
 * reach the live upstreams this app depends on?
 *
 * Proxy settings are per-process, so run this from the same shell, once with
 * and once without the proxy variables:
 *
 *   node scripts/check-network-egress.mjs
 *   NODE_USE_ENV_PROXY=1 HTTPS_PROXY=http://127.0.0.1:10808 \
 *     NO_PROXY=localhost,127.0.0.1,.aliyuncs.com \
 *     node scripts/check-network-egress.mjs
 *
 * The port is whatever inbound you point at. 10808 is v2rayN's usual SOCKS port
 * but is *mixed* on this machine — it answers both HTTP CONNECT and the SOCKS5
 * greeting — while 10809 is its default HTTP-only port. The script probes the
 * port and reports which protocol it speaks rather than assuming.
 *
 * Three traps this script exists to expose:
 *   - Node's `fetch` ignores HTTP_PROXY/HTTPS_PROXY unless NODE_USE_ENV_PROXY=1
 *     (Node 24+). Without the flag a proxy is simply not used.
 *   - It only understands an HTTP proxy (SOCKS5 exists but is experimental).
 *     A v2rayN/xray inbound may be SOCKS-only, in which case an `http://...`
 *     value pointing at it produces no HTTP reply — reported far away as
 *     `ECONNRESET ... before secure TLS connection was established`. The script
 *     sends a real CONNECT and says which protocol the port actually speaks.
 *   - The host has to be in NO_PROXY: suffix matching means `.aliyun.com` does
 *     NOT cover `dashscope.aliyuncs.com`, so a typo there silently sends the
 *     domestic APIs out through a foreign exit node.
 *
 * Any HTTP status counts as reachable: a 401 from a provider still proves the
 * network path works, a transport error proves it does not. The body has to
 * arrive too — a response whose bytes stall is a failure for this app, which
 * always reads the payload.
 */
import net from 'node:net';
import process from 'node:process';
import { describeFetchFailure } from '../server/providers/common/http.js';

const TIMEOUT_MS = 12000;
const PROBES = [
  {
    label: 'OpenSky 全球快照（航班层）',
    url: 'https://opensky-network.org/api/states/all?extended=1',
  },
  {
    label: 'adsb.lol 区域兜底（航班层）',
    url: 'https://api.adsb.lol/v2/lat/25/lon/121/dist/50',
  },
  {
    label: '百炼 HUD 摘要（国内，直连就行）',
    url: 'https://dashscope.aliyuncs.com/compatible-mode/v1/models',
  },
];

/** [host, port] of the configured HTTP proxy, or null when none is set. */
function readProxyTarget() {
  const raw =
    process.env.HTTPS_PROXY ||
    process.env.https_proxy ||
    process.env.HTTP_PROXY ||
    process.env.http_proxy ||
    '';
  if (!raw) return null;
  try {
    const url = new URL(raw);
    // A socks:// value is still worth probing: the port may well be a *mixed*
    // inbound, in which case switching the scheme to http:// is the whole fix.
    return {
      raw,
      scheme: /^socks/i.test(raw) ? 'socks' : url.protocol.replace(':', ''),
      host: url.hostname || null,
      port: Number(url.port) || (url.protocol === 'https:' ? 443 : 80),
    };
  } catch {
    return { raw, scheme: 'unparsable', host: null, port: 0 };
  }
}

/**
 * Would Node's proxy handling bypass the proxy for this host?
 *
 * Suffix matching, not substring: `.aliyun.com` covers `a.aliyun.com` but NOT
 * `dashscope.aliyuncs.com`. Getting this wrong is silent — the request still
 * succeeds, it just leaves through a foreign exit node first, which is how the
 * domestic APIs end up slow or timing out behind a proxy.
 *
 * @param {string} hostname
 * @returns {boolean}
 */
function bypassesProxy(hostname) {
  const list = (process.env.NO_PROXY || process.env.no_proxy || '')
    .split(',')
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);
  const host = hostname.toLowerCase();
  return list.some((entry) => {
    if (entry === '*') return true;
    const bare = entry.replace(/^\./, '');
    return host === bare || host.endsWith(`.${bare}`);
  });
}

/** Can we even open a TCP connection to the proxy port? */
function proxyAccepts(host, port) {
  return new Promise((resolve) => {
    const socket = net.connect({ host, port });
    const done = (value) => {
      socket.destroy();
      resolve(value);
    };
    socket.setTimeout(3000, () => done('timeout'));
    socket.on('connect', () => done('open'));
    socket.on('error', (error) => done(error.code || error.message));
  });
}

/**
 * Which protocol does the proxy port actually speak? A v2rayN/xray inbound is
 * often "mixed" (SOCKS + HTTP), but it can be SOCKS-only — and then an
 * `http://...` proxy value gets no HTTP reply at all. That failure is invisible
 * at the proxy and surfaces later as a TLS reset, so ask the port directly.
 *
 * Only the status line is needed, and CONNECT replies immediately, so this
 * costs one round trip even though the target is intentionally unresolvable.
 *
 * @param {string} host
 * @param {number} port
 * @returns {Promise<string>} `http:<status>` when it speaks HTTP, else why not.
 */
function proxySpeaksHttp(host, port) {
  return new Promise((resolve) => {
    const socket = net.connect({ host, port });
    let head = '';
    const done = (value) => {
      socket.destroy();
      resolve(value);
    };
    socket.setTimeout(4000, () => done(head ? 'no-http-reply' : 'timeout'));
    socket.on('error', (error) => done(error.code || error.message));
    socket.on('connect', () => {
      socket.write(
        'CONNECT example.invalid:443 HTTP/1.1\r\nHost: example.invalid:443\r\n\r\n',
      );
    });
    socket.on('data', (chunk) => {
      head += chunk.toString('latin1');
      if (!head.includes('\r\n')) return;
      const status = /^HTTP\/1\.[01] (\d{3})/.exec(head);
      done(status ? `http:${status[1]}` : 'not-http');
    });
    socket.on('close', () => done(head ? 'no-http-reply' : 'closed'));
  });
}

async function probe(url) {
  const started = Date.now();
  try {
    const response = await fetch(url, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    // Read the payload: headers alone do not prove the app can use the source.
    const body = await response.arrayBuffer();
    return {
      ok: true,
      note: `HTTP ${response.status} · ${(body.byteLength / 1024).toFixed(0)} KB · ${Date.now() - started} ms`,
    };
  } catch (error) {
    return { ok: false, note: describeFetchFailure(error) };
  }
}

async function main() {
  const proxy = readProxyTarget();
  const envProxyOn = process.env.NODE_USE_ENV_PROXY === '1';
  console.log(`Node ${process.version}`);
  console.log(
    `代理变量: ${proxy ? proxy.raw : '(未设置)'} · NODE_USE_ENV_PROXY=${envProxyOn ? '1' : '(未设置)'} · NO_PROXY=${process.env.NO_PROXY || process.env.no_proxy || '(未设置)'}`,
  );
  if (proxy && !envProxyOn)
    console.log(
      '⚠ 设了代理变量但没有 NODE_USE_ENV_PROXY=1 → Node 的 fetch 不会用这个代理，下面的结果等于直连。',
    );
  if (proxy && proxy.scheme === 'socks')
    console.log(
      '⚠ HTTPS_PROXY 写成了 socks:// —— Node 只有实验性的 SOCKS5 支持（实测不稳）。' +
        '\n   多数 v2rayN/xray 入站同时支持 HTTP，改回 http:// 即可；下面的探测会告诉你这个端口到底会不会讲 HTTP。',
    );
  if (proxy && proxy.host && envProxyOn) {
    const state = await proxyAccepts(proxy.host, proxy.port);
    console.log(
      state === 'open'
        ? `代理端口 ${proxy.host}:${proxy.port} 可连接 ✔`
        : `代理端口 ${proxy.host}:${proxy.port} 不可用（${state}）→ 代理没在监听，请求必然失败`,
    );
    if (state === 'open') {
      const spoken = await proxySpeaksHttp(proxy.host, proxy.port);
      console.log(
        /^http:\d+$/.test(spoken)
          ? `代理入站协议：支持 HTTP CONNECT（${spoken.replace('http:', 'HTTP ')}）✔`
          : `⚠ 代理端口不应答 HTTP CONNECT（${spoken}）→ 它是纯 SOCKS 入站，` +
              `http:// 代理值会让每个请求在 TLS 前被断开。请在 v2rayN 里改用「混合」入站，或把该入站换成 HTTP。`,
      );
    }
  }
  // Suffix matching: a typo here is silent, so name the exact hosts that will
  // leave the country through the proxy instead of going out directly.
  if (proxy && envProxyOn) {
    const leaked = PROBES.map(({ url }) => new URL(url).hostname).filter(
      (hostname) => !bypassesProxy(hostname),
    );
    const domestic = leaked.filter((hostname) => /(^|\.)(aliyun|aliyuncs|tencent)\.com$/.test(hostname));
    if (domestic.length)
      console.log(
        `⚠ NO_PROXY 没覆盖 ${domestic.join(', ')} → 国内接口会绕到境外节点再回来。` +
          '\n   注意后缀匹配：`.aliyun.com` 不覆盖 `dashscope.aliyuncs.com`。',
      );
  }
  console.log('');
  let failures = 0;
  for (const { label, url } of PROBES) {
    const result = await probe(url);
    if (!result.ok) failures += 1;
    console.log(`${result.ok ? '✔' : '✖'} ${label.padEnd(28)} ${result.note}`);
  }
  console.log('');
  if (!failures) {
    console.log('全部可达：这个世界里的 dev server 能拿到实时数据。');
    return;
  }
  console.log(
    envProxyOn
      ? '有失败项。代理已启用，说明问题在代理链路本身：节点不通、或 v2rayN 的路由规则把这些域名放行了直连。'
      : '有失败项。先加上 NODE_USE_ENV_PROXY=1 与 HTTP 代理变量再跑一次，对比即可定位。',
  );
}

await main();
