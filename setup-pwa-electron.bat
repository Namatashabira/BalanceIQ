@echo off
REM PWA & Desktop App Setup Script for Windows

echo.
echo 🚀 Oraka PWA ^& Desktop App Setup
echo ==================================
echo.

REM Check if Node is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js not found. Please install Node.js first.
    echo Visit: https://nodejs.org
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo ✅ Node.js found: %NODE_VERSION%
echo.

REM Install dependencies
echo 📦 Installing dependencies...
call npm install

if errorlevel 1 (
    echo ❌ Failed to install dependencies
    pause
    exit /b 1
)

echo ✅ Dependencies installed
echo.

REM Create directories
echo 📁 Creating directories...
if not exist "public\icons" mkdir public\icons
if not exist "public\screenshots" mkdir public\screenshots

echo ✅ Directories created
echo.

echo ==================================
echo ✅ Setup Complete!
echo.
echo 📖 Next Steps:
echo 1. Open QUICK_START_PWA_DESKTOP.md
echo 2. Add icon files to public/icons/
echo 3. Run: npm run dev (for PWA)
echo 4. Run: npm run start:electron (for Desktop)
echo 5. Run: npm run build:electron:win (to build installer)
echo.
echo 📚 Documentation:
echo - QUICK_START_PWA_DESKTOP.md (Start here!)
echo - PWA_ELECTRON_SETUP.md (Detailed guide)
echo - BACKEND_INTEGRATION.md (Django integration)
echo.
pause
