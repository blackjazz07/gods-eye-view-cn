export {
  readResponseTextCapped,
  readResponseJsonCapped,
  readResponseBytesCapped,
  coalesceProxyRequest,
} from '../../../src/sources/httpBody.js';

/**
 * Is this something we can mine for a name/message pair? `DOMException` (what
 * an aborted `fetch` rejects with) is an Error subclass whose numeric `code`
 * is a legacy quirk, so `name` has to win whenever `code` is not a string.
 *
 * @param {unknown} value Candidate cause-chain node.
 * @returns {boolean}
 */
function isErrorLike(value) {
  return (
    value instanceof Error ||
    (typeof value === 'object' &&
      value !== null &&
      typeof value.message === 'string')
  );
}

/**
 * Render a rejected `fetch` as a single line that names the transport-level
 * reason, not just the wrapper.
 *
 * `fetch` rejects with a bare `TypeError: fetch failed` and hides everything
 * actionable in `error.cause`: `ENOTFOUND` (DNS), `ECONNREFUSED`/`ECONNRESET`
 * (TCP), `UND_ERR_CONNECT_TIMEOUT` (the per-attempt budget), or a TLS code such
 * as `UNABLE_TO_VERIFY_LEAF_SIGNATURE`. Logging `error.message` alone cannot
 * tell "the name does not resolve" from "the peer reset us", which is exactly
 * the question a failed proxy call has to answer. An abort (our own
 * `AbortSignal.timeout`) is named too, so a budget overrun is not mistaken for
 * an unreachable upstream.
 *
 * Walks the cause chain — libuv wraps getaddrinfo/TLS failures one level
 * deeper — and folds in the branches of an AggregateError (one failure per
 * resolved address). Safe on any caught value: non-Error input is stringified,
 * and the detail comes from our own request paths, never from a response body.
 *
 * @param {unknown} error Caught value, typically a `fetch` rejection.
 * @returns {string} Single line, e.g.
 *   `TypeError: fetch failed <- ENOTFOUND: getaddrinfo ENOTFOUND host`.
 */
export function describeFetchFailure(error) {
  if (!isErrorLike(error)) return String(error);
  const label = (node) => {
    const name =
      typeof node.name === 'string' && node.name ? node.name : 'error';
    const code = typeof node.code === 'string' && node.code ? node.code : null;
    const head = code || name;
    const message = typeof node.message === 'string' ? node.message : '';
    return !message || message === head ? head : `${head}: ${message}`;
  };
  const seen = new Set();
  const parts = [];
  let node = error;
  // Bounded: a cause chain is short, but a hostile/cyclic one must not spin.
  while (isErrorLike(node) && !seen.has(node) && parts.length < 5) {
    seen.add(node);
    parts.push(label(node));
    if (Array.isArray(node.errors) && node.errors.length) {
      const branches = node.errors
        .slice(0, 3)
        .map((entry) => (isErrorLike(entry) ? label(entry) : String(entry)))
        .filter(Boolean)
        .join(' | ');
      if (branches) parts.push(`(${branches})`);
    }
    node = node.cause;
  }
  return parts.join(' <- ');
}

/**
 * Read a fetch Response body as text while enforcing a hard byte cap during
 * the read — so a malicious or buggy upstream that streams an unbounded body
 * (no/oversized Content-Length, chunked) can't OOM the proxy. Returns
 * { tooLarge, text }. Cancels the stream as soon as the cap is crossed.
 * @param {Response} upstream - fetch() response.
 * @param {number} maxBytes - hard ceiling on decoded bytes.
 * @returns {Promise<{tooLarge: boolean, text: string}>}
 */
export async function readCappedResponseText(upstream, maxBytes) {
  const declared = Number(upstream.headers.get('content-length'));
  if (Number.isFinite(declared) && declared > maxBytes) {
    try {
      await upstream.body?.cancel();
    } catch {
      /* no-op */
    }
    return { tooLarge: true, text: '' };
  }
  if (
    !upstream.body ||
    typeof upstream.body[Symbol.asyncIterator] !== 'function'
  ) {
    const text = await upstream.text();
    return text.length > maxBytes
      ? { tooLarge: true, text: '' }
      : { tooLarge: false, text };
  }
  const decoder = new TextDecoder();
  let text = '';
  let total = 0;
  for await (const chunk of upstream.body) {
    total += chunk.length;
    if (total > maxBytes) {
      try {
        await upstream.body.cancel();
      } catch {
        /* no-op */
      }
      return { tooLarge: true, text: '' };
    }
    text += decoder.decode(chunk, { stream: true });
  }
  text += decoder.decode();
  return { tooLarge: false, text };
}
