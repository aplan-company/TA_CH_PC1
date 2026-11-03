@echo off
cd /d %~dp0
if not exist node_modules\ws call npm install --no-audit --no-fund
start "" http://localhost:8090/test.html
node relay.js 8090
