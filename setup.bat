@echo off
setlocal EnableDelayedExpansion

title Kobo Highlights 2 Obsidian — Setup

echo.
echo  ========================================
echo   Kobo Highlights 2 Obsidian ^| Setup
echo  ========================================
echo.

:: ── Check Node.js ────────────────────────────────────────────────────────────
where node >nul 2>&1
if errorlevel 1 (
    echo  ERROR: Node.js is not installed or not on your PATH.
    echo.
    echo  Download and install Node.js from: https://nodejs.org
    echo  Then re-run this setup.
    echo.
    pause
    exit /b 1
)

:: ── Install dependencies ─────────────────────────────────────────────────────
echo  Step 1/3 ^| Installing dependencies...
echo.
call npm install
if errorlevel 1 (
    echo.
    echo  ERROR: npm install failed. Check the output above for details.
    pause
    exit /b 1
)

:: ── Ask for vault path ───────────────────────────────────────────────────────
echo.
echo  Step 2/3 ^| Vault path
echo.
echo  Enter the full path to your Obsidian vault.
echo  This is the folder that contains your notes (not the .obsidian subfolder).
echo.
echo  Example:  C:\Users\Name\Documents\Obsidian Vault
echo.
set /p "VAULT_INPUT=  Vault path: "

:: Strip surrounding quotes if the user pasted a quoted path
set VAULT_INPUT=%VAULT_INPUT:"=%

:: Check the path exists
if not exist "%VAULT_INPUT%\" (
    echo.
    echo  ERROR: Folder not found:
    echo    %VAULT_INPUT%
    echo.
    echo  Check the path and run setup.bat again.
    pause
    exit /b 1
)

:: ── Build and deploy ─────────────────────────────────────────────────────────
echo.
echo  Step 3/3 ^| Building and deploying...
echo.

set KOBO_VAULT=%VAULT_INPUT%
call npm run deploy
if errorlevel 1 (
    echo.
    echo  ERROR: Deploy failed. Check the output above for details.
    pause
    exit /b 1
)

:: ── Done ─────────────────────────────────────────────────────────────────────
echo.
echo  ========================================
echo   Done!
echo  ========================================
echo.
echo  Next steps in Obsidian:
echo    1. Settings ^> Community Plugins
echo    2. Enable community plugins if prompted
echo    3. Find "Kobo Highlights 2 Obsidian" and toggle it on
echo.
echo  To update later: run setup.bat again.
echo.
pause
