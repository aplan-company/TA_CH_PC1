@echo off
rem === check-only: open screen 1 in Chrome (do NOT use during show - WebSpout already runs the game) ===
start "" chrome --new-window "http://localhost:8090/santa_split.html?screen=1&ws=ws://localhost:8090"
