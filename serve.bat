@echo off
cd /d "%~dp0"
rem Local preview only - GitHub Pages does not run this script.
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0serve.ps1" %*
exit /b %ERRORLEVEL%
