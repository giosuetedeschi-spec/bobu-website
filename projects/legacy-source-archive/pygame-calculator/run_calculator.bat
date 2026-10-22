@echo off
REM Check if Python is installed
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Python is not installed or not in the PATH.
    echo Please install Python and try again.
    pause
    exit /b
)

REM Install Pygame
echo Installing Pygame...
pip install pygame

REM Run the Calculator
echo Starting Calculator...
python main.py
