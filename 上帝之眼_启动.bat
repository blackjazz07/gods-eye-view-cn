D:
cd D:\Mysoftware\GodsEyeView\gods-eye-view

set NODE_USE_ENV_PROXY=1
set HTTPS_PROXY=http://127.0.0.1:10808
set HTTP_PROXY=http://127.0.0.1:10808

REM set HTTPS_PROXY=http://127.0.0.1:7078
REM set HTTP_PROXY=http://127.0.0.1:7078
set NO_PROXY=localhost,127.0.0.1,::1
npm run dev