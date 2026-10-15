@echo off
REM Start the dev server with the proxy the live data sources need.
REM %~dp0 is this script's own folder, so renaming or moving the project
REM cannot silently break the launch (the old hard-coded path did).
cd /d "%~dp0"

REM Node's fetch reads HTTP_PROXY/HTTPS_PROXY only when this flag is set
REM (Node 24+). Without it both variables are ignored and we go out direct.
set NODE_USE_ENV_PROXY=1

REM The v2rayN/xray inbound. 10808 on this machine is a MIXED inbound: it
REM answers HTTP CONNECT as well as the SOCKS5 greeting, so http:// is right.
REM 10809 is v2rayN's default HTTP-only port; either works, pick the one that
REM is actually listening (netstat -ano | findstr 10808).

REM set HTTPS_PROXY=http://127.0.0.1:10808
REM set HTTP_PROXY=http://127.0.0.1:10808

REM Alternative inbound (Clash / other local proxies), kept for reference:
set HTTPS_PROXY=http://127.0.0.1:7078
set HTTP_PROXY=http://127.0.0.1:7078

REM NO_PROXY uses SUFFIX matching: ".aliyun.com" does NOT cover
REM "dashscope.aliyuncs.com". The Bailian voice + HUD summary APIs are in
REM Beijing, so they must leave directly instead of via a foreign exit node.
set NO_PROXY=localhost,127.0.0.1,::1,.aliyuncs.com,.aliyun.com


REM Uncomment to diagnose egress before starting: prints the proxy variables,
REM whether the port is listening, which protocol it speaks, and whether each
REM upstream is reachable.
REM node scripts/check-network-egress.mjs

npm run dev
