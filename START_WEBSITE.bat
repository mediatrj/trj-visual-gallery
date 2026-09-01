@echo off
title TRJ VISUAL GALLERY - LOCAL WEBSITE
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0START_LOCAL_SERVER.ps1"
if errorlevel 1 pause
