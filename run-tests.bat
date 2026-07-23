@echo off
chcp 65001 >nul
title AppSync Test Runner

echo ========================================
echo   AppSync - Running All Tests
echo ========================================
echo.

echo [1/3] Frontend Tests (52 tests)
echo -------------------------------
cd /d "%~dp0desktop"
call npx vitest run 2>&1
if %errorlevel% neq 0 (
    echo.
    echo [FAILED] Frontend
) else (
    echo.
    echo [PASSED] Frontend
)
echo.

echo [2/3] Backend Tests (34 tests)
echo -------------------------------
cd /d "%~dp0backend"
call npx vitest run 2>&1
if %errorlevel% neq 0 (
    echo.
    echo [FAILED] Backend
) else (
    echo.
    echo [PASSED] Backend
)
echo.

echo [3/3] Rust Tests (30 tests)
echo -------------------------------
cd /d "%~dp0desktop\src-tauri"
call cargo test 2>&1
if %errorlevel% neq 0 (
    echo.
    echo [FAILED] Rust
) else (
    echo.
    echo [PASSED] Rust
)
echo.

echo ========================================
if %errorlevel% equ 0 (
    echo   All tests passed!
) else (
    echo   Some tests failed - check output above
)
echo ========================================
echo.
pause
