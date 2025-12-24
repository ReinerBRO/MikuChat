@echo off
setlocal enabledelayedexpansion
chcp 65001 >nul

echo ========================================
echo    MikuChat Windows 一键环境搭建
echo ========================================
echo.

:: 切换到脚本所在目录
cd /d "%~dp0"

:: 1. 检查 Conda
echo [1/5] 正在检查 Conda 环境...
set CONDA_PATH=
set MINICONDA_DIR=

:: 检查常见的 Conda 安装路径
if exist "%USERPROFILE%\miniconda3\Scripts\activate.bat" (
    set CONDA_PATH="%USERPROFILE%\miniconda3\Scripts\activate.bat"
    set MINICONDA_DIR=%USERPROFILE%\miniconda3
) else if exist "%USERPROFILE%\anaconda3\Scripts\activate.bat" (
    set CONDA_PATH="%USERPROFILE%\anaconda3\Scripts\activate.bat"
    set MINICONDA_DIR=%USERPROFILE%\anaconda3
) else if exist "C:\ProgramData\miniconda3\Scripts\activate.bat" (
    set CONDA_PATH="C:\ProgramData\miniconda3\Scripts\activate.bat"
    set MINICONDA_DIR=C:\ProgramData\miniconda3
) else if exist "C:\ProgramData\anaconda3\Scripts\activate.bat" (
    set CONDA_PATH="C:\ProgramData\anaconda3\Scripts\activate.bat"
    set MINICONDA_DIR=C:\ProgramData\anaconda3
) else if exist "%LOCALAPPDATA%\miniconda3\Scripts\activate.bat" (
    set CONDA_PATH="%LOCALAPPDATA%\miniconda3\Scripts\activate.bat"
    set MINICONDA_DIR=%LOCALAPPDATA%\miniconda3
)

:: 如果没有找到 Conda，自动下载安装 Miniconda
if not defined CONDA_PATH (
    echo.
    echo [提示] 未检测到 Conda 环境，正在自动下载并安装 Miniconda...
    echo.
    
    set MINICONDA_INSTALLER=%TEMP%\Miniconda3-latest-Windows-x86_64.exe
    set MINICONDA_DIR=%USERPROFILE%\miniconda3
    
    :: 下载 Miniconda 安装程序
    echo 正在下载 Miniconda 安装程序 (约 80MB)...
    echo 下载地址: https://repo.anaconda.com/miniconda/Miniconda3-latest-Windows-x86_64.exe
    echo.
    
    :: 使用 PowerShell 下载（兼容性更好）
    powershell -Command "& {[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; Invoke-WebRequest -Uri 'https://repo.anaconda.com/miniconda/Miniconda3-latest-Windows-x86_64.exe' -OutFile '%MINICONDA_INSTALLER%' -UseBasicParsing}"
    
    if not exist "%MINICONDA_INSTALLER%" (
        echo [错误] Miniconda 下载失败。请检查网络连接或手动下载安装。
        echo 下载地址: https://docs.conda.io/en/latest/miniconda.html
        pause
        exit /b 1
    )
    
    echo 下载完成！正在安装 Miniconda (静默安装)...
    echo 安装目录: %MINICONDA_DIR%
    echo 这可能需要几分钟，请耐心等待...
    echo.
    
    :: 静默安装 Miniconda
    start /wait "" "%MINICONDA_INSTALLER%" /InstallationType=JustMe /RegisterPython=0 /AddToPath=0 /S /D=%MINICONDA_DIR%
    
    if not exist "%MINICONDA_DIR%\Scripts\activate.bat" (
        echo [错误] Miniconda 安装失败。
        pause
        exit /b 1
    )
    
    echo Miniconda 安装成功！
    echo.
    
    :: 删除安装程序
    del "%MINICONDA_INSTALLER%" 2>nul
    
    set CONDA_PATH="%MINICONDA_DIR%\Scripts\activate.bat"
)

echo [√] Conda 环境已就绪

:: 2. 创建并配置 Python 环境
echo.
echo [2/5] 正在配置 Python 环境 (mikuchat)...
call %CONDA_PATH% base

:: 检查环境是否已存在
conda info --envs | findstr "mikuchat" >nul 2>&1
if %ERRORLEVEL% equ 0 (
    echo [提示] mikuchat 环境已存在，跳过创建步骤...
) else (
    conda create -n mikuchat python=3.10 -y
)

call %CONDA_PATH% mikuchat

echo.
echo [3/5] 正在安装后端依赖 (这可能需要几分钟)...
cd backend
pip install numpy==1.26.4
pip install psutil==7.1.3
pip install gradio==6.1.0
pip install x_transformers==2.11.24
pip install pytorch_lightning==2.6.0
pip install matplotlib==3.10.0
pip install peft==0.18.0
pip install wordsegment==1.3.1
pip install g2p_en==2.1.0
echo 正在下载 NLTK 数据包...
python -c "import nltk; nltk.download('averaged_perceptron_tagger_eng')"
pip install -r requirements.txt
if %ERRORLEVEL% neq 0 (
    echo [错误] 后端依赖安装失败。
    pause
    exit /b 1
)
cd ..

:: 4. 检查 Node.js
echo.
echo [4/5] 正在检查 Node.js 环境...
node -v >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo.
    echo [提示] 未检测到 Node.js，正在自动下载并安装...
    echo.
    
    set NODEJS_INSTALLER=%TEMP%\node-v20-lts-win-x64.msi
    
    :: 下载 Node.js LTS
    echo 正在下载 Node.js LTS (约 30MB)...
    powershell -Command "& {[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; Invoke-WebRequest -Uri 'https://nodejs.org/dist/v20.11.0/node-v20.11.0-x64.msi' -OutFile '%NODEJS_INSTALLER%' -UseBasicParsing}"
    
    if not exist "%NODEJS_INSTALLER%" (
        echo [错误] Node.js 下载失败。请检查网络连接或手动下载安装。
        echo 下载地址: https://nodejs.org/
        pause
        exit /b 1
    )
    
    echo 下载完成！正在安装 Node.js...
    msiexec /i "%NODEJS_INSTALLER%" /qn /norestart
    
    :: 刷新 PATH
    set PATH=%PATH%;C:\Program Files\nodejs
    
    del "%NODEJS_INSTALLER%" 2>nul
    
    echo Node.js 安装完成！
    echo.
)

echo [√] Node.js 环境已就绪

:: 5. 安装前端依赖并构建
echo.
echo [5/5] 正在安装前端依赖并构建...
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
echo 提示：首次运行需要下载模型权重文件，
echo 请参考 README.md 中的百度网盘链接。
echo.
pause
