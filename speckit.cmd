@echo off
setlocal
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0speckit.ps1" %*
exit /b %errorlevel%
