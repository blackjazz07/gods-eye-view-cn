/**
 * The byte budget for one WebRTC data-channel message, and how to read it.
 *
 * A `session.update` carries the GEV instructions plus every tool schema, which
 * is more than one SCTP message may hold, so the client splits it across
 * several events (see `realtimeConnection.js`). Splitting needs the real number,
 * and the number is negotiated rather than configured: the peer advertises
 * `a=max-message-size:<bytes>` in the SDP answer, RFC 8841 makes 65536 the
 * default when that attribute is absent, and `RTCSctpTransport.maxMessageSize`
 * exposes the negotiated result to the browser.
 *
 * Both ends of the negotiation live in this repo — the browser applies the
 * budget, the server proxies and logs the answer — so the knowledge sits in one
 * module and the two cannot drift.
 */

/**
 * RFC 8841 default for `a=max-message-size` when a peer omits the attribute.
 * Used when nothing else is known, never as "no limit".
 */
export const DEFAULT_MAX_MESSAGE_SIZE = 65536;

/**
 * The ceiling advertised in an SDP body, or 0 when the attribute is absent.
 *
 * One body can hold several media sections (audio plus the SCTP application
 * section). The attribute belongs to the data-channel section, and a peer that
 * advertises it more than once is describing the same association, so the
 * smallest advertisement is the one that holds. A value of 0 is discarded
 * rather than treated as "unlimited": the peer's own text is what we would have
 * to trust, and over-sending is the failure this module exists to prevent.
 */
export function maxMessageSizeFromSdp(sdp) {
  // Built per call: a module-level /g regex carries lastIndex between callers.
  const pattern = /^a=max-message-size:(\d+)\s*$/gim;
  let smallest = 0;
  for (const match of String(sdp ?? '').matchAll(pattern)) {
    const bytes = Number(match[1]);
    if (!Number.isFinite(bytes) || bytes <= 0) continue;
    if (!smallest || bytes < smallest) smallest = bytes;
  }
  return smallest;
}

/**
 * Resolve the budget for one outgoing data-channel message, most authoritative
 * source first. Always a positive byte count.
 *
 * `sctp` wins when present: it is the transport's own figure and already
 * accounts for both peers. The remote SDP is next — it is the answer the peer
 * actually sent, and it is where the value survives in a runtime that does not
 * expose `maxMessageSize`. The RFC default is last, and that ordering is the
 * point: an unknown budget resolving to 0 used to disable the pre-flight check
 * in `sendSessionStep`, so an oversized `session.update` was sent blind, threw,
 * and left the session with no tools at all. Guessing low only trims the tool
 * list, which the log records and the next variant recovers from.
 */
export function resolveDataChannelBudget({
  sctpMaxMessageSize,
  dataChannelMaxMessageSize,
  remoteSdp,
} = {}) {
  const candidates = [
    ['sctp', sctpMaxMessageSize],
    ['channel', dataChannelMaxMessageSize],
    ['sdp', maxMessageSizeFromSdp(remoteSdp)],
  ];
  for (const [source, value] of candidates) {
    const bytes = Number(value);
    if (Number.isFinite(bytes) && bytes > 0) return { bytes, source };
  }
  return { bytes: DEFAULT_MAX_MESSAGE_SIZE, source: 'default' };
}
