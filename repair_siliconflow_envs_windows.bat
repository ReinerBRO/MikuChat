@echo off
setlocal
chcp 65001 >nul

cd /d "%~dp0"

echo ========================================
echo   MikuChat SiliconFlow env repair
echo ========================================
echo.
echo This script will:
echo 1. Find every .env file under the project
echo 2. Test every SiliconFlow-style key it finds
echo 3. Pick the first key that passes validation
echo 4. Rewrite all .env files to the same valid key
echo 5. Auto-detect the MikuChat project folder
echo.

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0repair_siliconflow_envs_windows.ps1"
set EXIT_CODE=%ERRORLEVEL%

echo.
if not "%EXIT_CODE%"=="0" (
    echo Repair failed with exit code %EXIT_CODE%.
) else (
    echo Repair completed successfully.
)

pause
endlocal
