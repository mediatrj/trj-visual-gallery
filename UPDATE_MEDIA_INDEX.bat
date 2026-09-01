@echo off
cd /d "%~dp0"
title TRJ Visual Gallery - Media Update
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0UPDATE_MEDIA_INDEX.ps1"
