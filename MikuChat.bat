@echo off
setlocal enabledelayedexpansion

echo 正在启动 MikuChat (桌面模式)...

:: 切换到脚本所在目录
cd /d "%~dp0"

:: 尝试激活 conda 环境
:: 检查常见的 conda 安装路径
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

if defined CONDA_PATH (
    echo 正在激活 conda 环境: mikuchat
    call %CONDA_PATH% mikuchat
) else (
    echo [警告] 未找到 conda 路径，将尝试使用当前环境运行。
)

:: 运行 App 封装脚本
python miku_app.py

if %ERRORLEVEL% neq 0 (
    echo.
    echo [错误] 应用运行失败。请检查是否已安装依赖并完成前端构建 (npm run build)。
    pause
)

endlocal
