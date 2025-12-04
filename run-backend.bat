@echo off
echo ========================================
echo   Starting EduRent Backend Server
echo ========================================
echo.

cd /d "%~dp0edurentbackend"

echo Checking Java version...
java -version
if errorlevel 1 (
    echo ERROR: Java not found! Please install Java 17 or higher.
    pause
    exit /b 1
)

echo.
echo ========================================
echo   Option 1: Using Maven (if installed)
echo ========================================

where mvn >nul 2>nul
if %errorlevel% equ 0 (
    echo Maven found! Starting with Maven...
    mvn spring-boot:run
    goto :end
)

echo Maven not found.
echo.
echo ========================================
echo   Please use your IDE to run the server
echo ========================================
echo.
echo Open your IDE (IntelliJ/Eclipse/VS Code) and run:
echo   File: edurentbackend/src/main/java/com/edurent/crc/CrcApplication.java
echo.
echo OR install Maven from: https://maven.apache.org/download.cgi
echo.
pause

:end
