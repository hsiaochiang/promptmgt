@echo off
setlocal
REM 設定編碼為 UTF-8 以顯示中文
chcp 65001 >nul
title Prompt Manager - Prod

REM ==========================================
REM 1. 確保工作目錄正確
REM %~dp0 會指向此 .bat 檔所在的資料夾
REM ==========================================
cd /d "%~dp0"

REM 檢查此目錄下是否有 package.json
IF NOT EXIST "package.json" (
    echo.
    echo [ERROR] 找不到 package.json！
    echo.
    echo 請確保此 start-prod.bat 檔案是放在專案的「根目錄」下
    echo (即與 package.json 放在同一個資料夾)。
    echo.
    echo 目前執行路徑: %cd%
    echo.
    goto ErrorHandler
)

REM ==========================================
REM 2. 設定生產環境變數
REM ==========================================
set NODE_ENV=production

echo [INFO] 正在檢查依賴套件...
call npm install
IF %ERRORLEVEL% NEQ 0 (
    echo [ERROR] npm install 失敗。
    goto ErrorHandler
)

echo [INFO] 正在建置專案...
call npm run build
IF %ERRORLEVEL% NEQ 0 (
    echo [ERROR] npm run build 失敗。
    goto ErrorHandler
)

echo [INFO] 正在啟動伺服器...
call npm start
IF %ERRORLEVEL% NEQ 0 (
    echo [ERROR] 伺服器啟動失敗。
    goto ErrorHandler
)

goto End

:ErrorHandler
echo.
echo ==========================================
echo 發生錯誤，系統無法啟動。
echo ==========================================
pause
exit /b

:End
echo.
echo 伺服器已停止或結束，按任意鍵關閉視窗...
pause >nul