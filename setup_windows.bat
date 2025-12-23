@echo off
setlocal enabledelayedexpansion

echo ========================================
echo    MikuChat Windows 一键环境搭建
echo ========================================
echo.

:: 切换到脚本所在目录
cd /d "%~dp0"

:: 1. 检查 Conda
echo [1/4] 正在检查 Conda 环境...
set CONDA_PATH=
if exist "%USERPROFILE%\miniconda3\Scripts\activate.bat" (
    set CONDA_PATH="%USERPROFILE%\miniconda3\Scripts\activate.bat"
) else if exist "%USERPROFILE%\anaconda3\Scripts\activate.bat" (
    set CONDA_PATH="%USERPROFILE%\anaconda3\Scripts\activate.bat"
) else if exist "C:\ProgramData\miniconda3\Scripts\activate.bat" (
    set CONDA_PATH="C:\ProgramData\miniconda3\Scripts\activate.bat"
) else if exist "C:\ProgramData\anaconda3\Scripts\activate.bat" (
    set CONDA_PATH="C:\ProgramData\anaconda3\Scripts\activate.bat"
)

if not defined CONDA_PATH (
    echo [错误] 未找到 Conda 安装路径。请先安装 Miniconda 或 Anaconda。
    pause
    exit /b 1
)

:: 2. 创建并配置 Python 环境
echo [2/4] 正在配置 Python 环境 (mikuchat)...
call %CONDA_PATH% base
conda create -n mikuchat python=3.10 -y
call %CONDA_PATH% mikuchat

echo 正在安装后端依赖 (这可能需要几分钟)...
cd backend
pip install numpy==1.26.4
pip install -r requirements.txt
if %ERRORLEVEL% neq 0 (
    echo [错误] 后端依赖安装失败。
    pause
    exit /b 1
)
cd ..

:: 3. 检查 Node.js
echo [3/4] 正在检查 Node.js 环境...
node -v >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [错误] 未找到 Node.js。请先安装 Node.js (LTS 版本)。
    pause
    exit /b 1
)

:: 4. 安装前端依赖并构建
echo [4/4] 正在安装前端依赖并构建...
cd frontend
call npm install
if %ERRORLEVEL% neq 0 (
    echo [错误] 前端依赖安装失败。
    pause
    exit /b 1
)

echo 正在构建前端静态资源...
call npx vite build
if %ERRORLEVEL% neq 0 (
    echo [警告] 前端构建遇到错误，但可能已生成部分资源。
)
cd ..

echo.
echo ========================================
echo    ✨ 环境搭建完成！ ✨
echo ========================================
echo.
echo 现在你可以：
echo 1. 双击 start.bat 启动服务 (浏览器模式)
echo 2. 双击 MikuChat.bat 启动桌面模式
echo.
pause
