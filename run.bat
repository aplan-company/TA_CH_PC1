@echo off
setlocal enabledelayedexpansion
cd /d %~dp0
rem === PC1: relay + host screen 1 (wall 3952x1200) ===
start "SANTA relay" cmd /k node relay.js 8090
timeout /t 2 /nobreak >nul
set "URL=http://localhost:8090/santa_split.html?screen=1&host=1&ws=ws://localhost:8090&hud=0"
start "" chrome --new-window --start-fullscreen --autoplay-policy=no-user-gesture-required --disable-background-timer-throttling --disable-renderer-backgrounding --disable-backgrounding-occluded-windows --no-first-run --disable-session-crashed-bubble --hide-crash-restore-bubble --noerrdialogs "!URL!"
