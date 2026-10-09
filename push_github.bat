@echo off
title Push Trading Playbook len GitHub
cd /d "%~dp0"
echo ======================================================
echo    DANG PUSH CODE LEN GITHUB (shinoniz9-rgb)...
echo ======================================================
git push -u origin main
if %errorlevel% equ 0 (
    echo.
    echo ======================================================
    echo  [THANH CONG] Da day ma nguon len GitHub thanh cong!
    echo ======================================================
) else (
    echo.
    echo ======================================================
    echo  [CHU Y] Neu bao loi 'Repository not found':
    echo  Vui long vao https://github.com/new tao repo ten:
    echo  'tradingplaybook_tool' (chon Public hoac Private)
    echo  roi nhap dup chuot lai vao file push_github.bat nay nhe!
    echo ======================================================
)
pause
