@echo off
REM WeAD Platform - Local Development Runner (Windows)
REM This script runs the platform on localhost:5000

echo.
echo ========================================
echo   WeAD Platform - Local Development
echo ========================================
echo.

REM Check if .env exists
if not exist .env (
    echo [WARNING] .env file not found. Creating from template...
    if exist env.local.example (
        copy env.local.example .env
        echo [SUCCESS] Created .env from env.local.example
        echo [INFO] Please edit .env with your configuration
    ) else (
        echo [WARNING] env.local.example not found. Using default values.
    )
)

REM Activate virtual environment if it exists
if exist venv\Scripts\activate.bat (
    echo [INFO] Activating virtual environment...
    call venv\Scripts\activate.bat
) else (
    echo [WARNING] Virtual environment not found. Creating one...
    python -m venv venv
    call venv\Scripts\activate.bat
    echo [INFO] Installing dependencies...
    pip install -r requirements.txt
)

echo.
echo [SUCCESS] Starting WeAD Platform...
echo.
echo Local URLs:
echo   http://localhost:5000
echo   http://127.0.0.1:5000
echo.
echo Press CTRL+C to stop
echo.

REM Run the application
python bot.py

pause





