@echo off
setlocal
title Prompt Manager - Dev
cd /d "%~dp0.."

REM 可選：覆寫資料路徑
REM set DB_FILE=D:\deploy\promptmgt\data\db.json
REM set DEFAULT_ROOT=D:\deploy\promptmgt\Prompts

call npm install
call npm run dev
echo.
echo 伺服器已停止或結束，按任意鍵關閉視窗...
pause >nul
