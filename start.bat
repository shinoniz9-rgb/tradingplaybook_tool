@echo off
title Trading Playbook
cd /d "%~dp0"
echo ======================================================
echo    DANG KHOI DONG TRADING PLAYBOOK...
echo ======================================================
start http://localhost:3000
node server.js
pause
