@echo off
REM start.bat — Start both backend and frontend on Windows.
REM Usage: double-click or run from cmd

echo.
echo ==========================================
echo      ISL Translator -- Starting Up
echo ==========================================
echo.

echo [1/2] Installing and starting FastAPI backend...
cd backend
pip install -r requirements.txt
start "ISL Backend" cmd /k "uvicorn main:app --reload --port 8000"
cd ..

timeout /t 3 /nobreak >nul

echo [2/2] Installing and starting React frontend...
cd frontend
call npm install
start "ISL Frontend" cmd /k "npm run dev"
cd ..

echo.
echo Both servers started in separate windows!
echo.
echo   Frontend -^> http://localhost:5173
echo   Backend  -^> http://localhost:8000
echo   API Docs -^> http://localhost:8000/docs
echo.
pause
