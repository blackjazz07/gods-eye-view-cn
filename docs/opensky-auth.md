# OpenSky Auth Setup

God's Eye View uses explicit auth modes for `/api/flights`:

- `OPENSKY_AUTH_MODE=oauth` (default, recommended)
- `OPENSKY_AUTH_MODE=auto` (OAuth first, then Basic fallback)
- `OPENSKY_AUTH_MODE=basic`
- `OPENSKY_AUTH_MODE=anon`

Reference: OpenSky REST API docs recommend OAuth2 Client Credentials flow.

## Quick Start (OAuth Client JSON)

Import credentials from JSON (`clientId`/`clientSecret` or `client_id`/`client_secret`) into Keychain:

```bash
./scripts/opensky-import-client.sh ~/Downloads/credentials.json
# or: npm run opensky:import -- ~/Downloads/credentials.json
```

Then launch:

```bash
./scripts/dev-fresh.sh
```

Expected startup lines:

- `OpenSky auth mode: oauth`
- `OpenSky OAuth: configured`

## Optional: Launch With File (No Keychain Import)

```bash
OPENSKY_CREDENTIALS_FILE=~/Downloads/credentials.json ./scripts/dev-fresh.sh
```

Launchers resolve OAuth creds in this order:

1. `OPENSKY_CLIENT_ID` + `OPENSKY_CLIENT_SECRET`
2. `OPENSKY_CREDENTIALS_FILE`
3. Keychain (`opensky-network` / `client_id`, `client_secret`)

## Basic Auth (Legacy)

Basic auth is still supported for now, but OpenSky is moving away from it.

```bash
OPENSKY_AUTH_MODE=basic ./scripts/dev-fresh.sh
```

## Troubleshooting

Inspect proxy headers:

```bash
curl -si http://localhost:4173/api/flights | grep -iE 'HTTP/|X-OpenSky-Auth'
```

Useful reasons:

- `oauth_invalid_or_missing`: OAuth client not found/usable
- `oauth_invalid_credentials`: OAuth client rejected by OpenSky
- `basic_invalid_credentials`: username/password rejected
- `missing_basic_creds`: basic mode missing user/pass
- `rate_limited`: OpenSky throttling

### `fetch failed` in the server log

Two lines in a row are one failed cycle, not two problems:

```
[OpenSky] global snapshot attempt failed, retrying: <reason>
[OpenSky Proxy] <reason>
```

The snapshot is attempted twice, 10 s each; the first line is the retry and the
second one is the second attempt giving up. Both then fall back to the last-good
cached body (`X-OpenSky-Cache: STALE`) and then to a 250 nm adsb.lol regional
snapshot (`X-Flight-Source: adsb.lol`), so the layer keeps rendering either way.

`<reason>` names the transport-level cause, read from the `cause` chain:

- `... <- ENOTFOUND: getaddrinfo ENOTFOUND opensky-network.org` — the name does
  not resolve here. Check DNS, VPN or hosts-file entries.
- `... <- ECONNRESET` / `... <- ECONNREFUSED` — the peer or a middlebox tore the
  connection down. Common on filtered routes; a proxy/VPN usually fixes it.
- `TimeoutError: The operation was aborted due to timeout` — no answer within
  the 10 s per-attempt budget. The global snapshot is ~1.4 MB, so a slow link
  reaches this before a broken one does.
- `... <- UNABLE_TO_VERIFY_LEAF_SIGNATURE` (or another TLS code) — a TLS
  inspection appliance is in the path.

If the host reaches OpenSky only through a proxy: Node's `fetch` ignores
`HTTP_PROXY`/`HTTPS_PROXY` unless the server is started with
`NODE_USE_ENV_PROXY=1` (Node 24+). Without it the proxy is bypassed and a direct
connection is attempted, which is the usual cause of a reset or a timeout on a
proxied network.

