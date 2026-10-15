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
- `... <- ERR_SSL_SSL/TLS_ALERT_HANDSHAKE_FAILURE` — the handshake began and the
  far side refused it (alert 40). Seen through a proxy: the exit IP is blocked
  by that host, or something between the two is rewriting TLS. Try another node.

If the host reaches OpenSky only through a proxy: Node's `fetch` ignores
`HTTP_PROXY`/`HTTPS_PROXY` unless the server is started with
`NODE_USE_ENV_PROXY=1` (Node 24+). Without it the proxy is bypassed and a direct
connection is attempted, which is the usual cause of a reset or a timeout on a
proxied network.

### Running behind v2rayN (or any local proxy)

The browser is fine — it follows the system proxy that v2rayN installs. The
**server is not**: every fetch the dev server makes is a plain Node `fetch`, and
Node does not read the system proxy at all. So a working browser proves nothing
about the flights layer.

Check what the server actually gets, from the same terminal that starts it:

```bash
npm run net:check
NODE_USE_ENV_PROXY=1 HTTPS_PROXY=http://127.0.0.1:10808 \
  NO_PROXY=localhost,127.0.0.1,.aliyuncs.com npm run net:check
```

Three requirements, all of them easy to get wrong:

1. **The port has to speak HTTP.** Node's `fetch` only understands an HTTP
   proxy; its SOCKS5 support exists but is experimental and unstable. A v2rayN
   inbound may be SOCKS-only (then an `http://...` value gets no HTTP reply at
   all, and the request dies with a TLS reset) or **mixed**, which answers both
   HTTP `CONNECT` and the SOCKS5 greeting — 10808 on this machine is mixed, so
   `http://127.0.0.1:10808` works as-is. `npm run net:check` sends a real
   CONNECT and tells you which one yours is, so there is no need to guess. If it
   turns out SOCKS-only, set `本地监听端口(Http)` under
   `设置 → 参数设置 → Core:基础设置` to `10809` and point `HTTPS_PROXY` there.
2. **Start the server with the flag**, not just the variables:

   ```bash
   NODE_USE_ENV_PROXY=1 HTTPS_PROXY=http://127.0.0.1:10808 \
     NO_PROXY=localhost,127.0.0.1,.aliyuncs.com npm run dev
   ```

   Without `NODE_USE_ENV_PROXY=1` the variables are read by nothing.
   The checked-in `上帝之眼_启动.bat` does this; it resolves its own folder with
   `%~dp0`, so moving or renaming the project cannot silently leave the
   variables in the wrong shell.
3. **Keep the domestic endpoints out of the proxy.** `NO_PROXY` must cover
   `localhost` (Vite's own HMR and the internal API calls) and `.aliyuncs.com`
   (Bailian voice + HUD summary are in Beijing). Sending those through a foreign
   node adds a round trip abroad and can fail outright. **The match is a suffix
   match, not a substring one**: `.aliyun.com` covers `foo.aliyun.com` but *not*
   `dashscope.aliyuncs.com` — one missing `s` still sends every domestic API out
   through the tunnel, silently. `npm run net:check` reports any probe host that
   is not covered.

Alternatively enable v2rayN's **TUN mode** (虚拟网卡), which routes every process
transparently at the network layer — no variables, no per-app configuration. It
needs administrator rights, and it is the only option that also covers tools
that ignore proxy settings.

If the app still fails with the flag on, the proxy is not the problem any more —
`npm run net:check` will say whether the TCP/TLS path through it is refused, slow
(`TimeoutError`), or reset. A `CONNECT` that succeeds and a TLS handshake that
dies right after usually means v2rayN is routing these domains **direct**
(check 路由设置: the predefined rule must not be 直连, and add a custom rule that
sends `domain:opensky-network.org,domain:adsb.lol` to your proxy outbound), or
that the selected node cannot reach them.

