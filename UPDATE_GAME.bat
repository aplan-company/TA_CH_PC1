@echo off
rem === PC1: download latest santa_split.html from GitHub, then reload all 4 walls ===
rem Put this file in the same folder as santa_split.html (the folder relay.js runs in).
cd /d %~dp0
set "URL=https://raw.githubusercontent.com/aplan-company/TA_CH_PC1/main/santa_split.html"
echo [update] downloading latest game ...
curl -fsSL -o santa_split.new "%URL%?t=%RANDOM%"
if errorlevel 1 goto fail
for %%A in (santa_split.new) do set SIZE=%%~zA
if %SIZE% LSS 100000 goto fail
if exist santa_split.html copy /y santa_split.html santa_split.bak >nul
move /y santa_split.new santa_split.html >nul
echo [update] OK (%SIZE% bytes). previous version saved as santa_split.bak
echo [update] reloading walls ...
curl -s -o nul http://localhost:8090/cmd/reload
echo [update] done.
timeout /t 5 >nul
exit /b 0
:fail
if exist santa_split.new del santa_split.new
echo [update] FAILED - kept current file. check internet.
pause
