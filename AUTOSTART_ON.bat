@echo off
rem === Windows start-up: run START.bat automatically at login ===
set "LNK=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\TA_CH_PC1.lnk"
powershell -NoProfile -ExecutionPolicy Bypass -Command "$s=(New-Object -ComObject WScript.Shell).CreateShortcut($env:LNK);$s.TargetPath='%~dp0START.bat';$s.WorkingDirectory='%~dp0';$s.WindowStyle=7;$s.Save()"
if exist "%LNK%" (echo [OK] autostart installed: %LNK%) else (echo [FAIL] could not create shortcut)
pause
