@echo off
rem === TA_CH_PC1 (MASTER) : update from GitHub, then run ===
cd /d %~dp0
where git >nul 2>nul
if errorlevel 1 (
  echo [update] git not found - running local files
) else (
  echo [update] git pull ...
  git -c http.lowSpeedLimit=1000 -c http.lowSpeedTime=10 pull --ff-only || echo [update] pull failed - running local files
)
if not exist node_modules\ws call npm install --no-audit --no-fund
call "%~dp0run.bat"
