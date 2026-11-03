@echo off
cd /d %~dp0
rem === PC1: relay only. Game screen is opened by WebSpout (Spout sender) ===
rem WebSpout URL (PC1): http://localhost:8090/santa_split.html?screen=1&host=1&ws=ws://localhost:8090&hud=0
start "SANTA relay" /min cmd /k node relay.js 8090
timeout /t 2 /nobreak >nul
set "WS=%USERPROFILE%\Desktop\WebSpout\WebSpout.exe"
if exist "%WS%" start "" "%WS%"
