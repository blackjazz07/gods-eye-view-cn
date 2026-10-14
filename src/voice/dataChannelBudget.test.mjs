import assert from 'node:assert/strict';
import test from 'node:test';
import {
  DEFAULT_MAX_MESSAGE_SIZE,
  maxMessageSizeFromSdp,
  resolveDataChannelBudget,
} from './dataChannelBudget.js';

test('sdp: reads the attribute from a Bailian-style answer with CRLF lines', () => {
  const answer = [
    'v=0',
    'o=- 1 2 IN IP4 127.0.0.1',
    'm=audio 9 UDP/TLS/RTP/SAVPF 111',
    'a=mid:audio',
    'm=application 9 UDP/DTLS/SCTP webrtc-datachannel',
    'a=mid:data',
    'a=sctp-port:5000',
    'a=max-message-size:65536',
    '',
  ].join('\r\n');
  assert.equal(maxMessageSizeFromSdp(answer), 65536);
});

test('sdp: an absent attribute reads as 0, not as unlimited', () => {
  assert.equal(maxMessageSizeFromSdp('m=application 9 UDP/DTLS/SCTP x\r\n'), 0);
  assert.equal(maxMessageSizeFromSdp(''), 0);
  assert.equal(maxMessageSizeFromSdp(null), 0);
});

test('sdp: a repeated attribute resolves to the smallest advertisement', () => {
  const sdp = 'a=max-message-size:262144\r\na=max-message-size:16384\r\n';
  assert.equal(maxMessageSizeFromSdp(sdp), 16384);
});

test('sdp: a non-positive advertisement is discarded rather than trusted', () => {
  assert.equal(maxMessageSizeFromSdp('a=max-message-size:0\r\n'), 0);
});

test('sdp: a longer attribute name is not mistaken for this one', () => {
  assert.equal(maxMessageSizeFromSdp('a=max-message-size-hint:4096\r\n'), 0);
});

test('budget: the negotiated SCTP figure wins over the SDP text', () => {
  assert.deepEqual(
    resolveDataChannelBudget({
      sctpMaxMessageSize: 65536,
      remoteSdp: 'a=max-message-size:16384\r\n',
    }),
    { bytes: 65536, source: 'sctp' },
  );
});

test('budget: the answer SDP is used when the transport exposes nothing', () => {
  assert.deepEqual(
    resolveDataChannelBudget({
      sctpMaxMessageSize: undefined,
      dataChannelMaxMessageSize: undefined,
      remoteSdp: 'a=max-message-size:262144\r\n',
    }),
    { bytes: 262144, source: 'sdp' },
  );
});

test('budget: an unknown negotiation resolves to the RFC default, never 0', () => {
  // The regression: a 0 budget silenced the pre-flight check in
  // sendSessionStep, so an oversized session.update was sent blind and threw.
  assert.deepEqual(resolveDataChannelBudget(), {
    bytes: DEFAULT_MAX_MESSAGE_SIZE,
    source: 'default',
  });
  assert.deepEqual(
    resolveDataChannelBudget({
      sctpMaxMessageSize: 0,
      dataChannelMaxMessageSize: 0,
      remoteSdp: 'v=0\r\n',
    }),
    { bytes: DEFAULT_MAX_MESSAGE_SIZE, source: 'default' },
  );
});
