@echo off
echo Starting MikuChat...
echo.

REM Kill existing processes on ports
echo Checking for existing processes...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8000') do taskkill /F /PID %%a 2>nul
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5173') do taskkill /F /PID %%a 2>nul

REM Start Backend
echo Starting Backend (Port 8000)...
cd backend
start "MikuChat Backend" C:\Users\rikka0612\miniconda3\envs\mikuchat\python.exe -m uvicorn main:app --reload --port 8000
cd ..

REM Wait a moment for backend to start
timeout /t 2 /nobreak >nul

REM Start Frontend
echo Starting Frontend (Port 5173)...
cd frontend
start "MikuChat Frontend" npm run dev
cd ..

echo.
echo ========================================
echo MikuChat is starting!
echo Backend: http://localhost:8000
echo Frontend: http://localhost:5173
echo ========================================
echo.
echo Press any key to stop all services...
pause >nul

REM Cleanup
echo Stopping services...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8000') do taskkill /F /PID %%a 2>nul
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5173') do taskkill /F /PID %%a 2>nul
echo Services stopped.
