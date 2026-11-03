@echo off
rem === TA_CH_PC1 : update from GitHub, then run (autostart: AUTOSTART_ON.bat) ===
cd /d %~dp0
where git >nul 2>nul
if errorlevel 1 goto run
echo [update] waiting for network ...
set /a tries=0
:net
ping -n 1 -w 1500 github.com >nul 2>nul
if not errorlevel 1 goto pull
set /a tries+=1
if %tries% geq 20 goto nopull
timeout /t 1 /nobreak >nul
goto net
:pull
echo [update] git pull ...
git -c http.lowSpeedLimit=1000 -c http.lowSpeedTime=10 pull --ff-only
if errorlevel 1 echo [update] pull failed - running local files
goto run
:nopull
echo [update] no network - running local files
:run
if not exist node_modules\ws call npm install --no-audit --no-fund
call "%~dp0run.bat"
