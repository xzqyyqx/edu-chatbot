@echo off
chcp 65001 > nul
echo.
echo  ========================================
echo    职职学院 AI智能客服系统 v1.0
echo  ========================================
echo.
echo  正在启动服务...
echo.
cd /d "%~dp0backend"
node src/server.js
pause
