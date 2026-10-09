@echo off
title Push Trading Playbook len GitHub
cd /d "%~dp0"
echo ======================================================
echo    DANG DONG GOI VA PUSH CODE LEN GITHUB...
echo ======================================================
git add .
git commit -m "feat: toi uu PWA va cai dat app tren iPhone cho duong dan GitHub"
git push -u origin main
if %errorlevel% equ 0 (
    echo.
    echo ======================================================
    echo  [THANH CONG] Da day toan bo ma nguon len GitHub!
    echo  Dia chi GitHub Pages (neu da bat):
    echo  https://shinoniz9-rgb.github.io/tradingplaybook_tool/
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
