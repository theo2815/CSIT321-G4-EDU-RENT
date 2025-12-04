@echo off
echo ======================================
echo Starting EduRent Backend Server
echo ======================================
echo.

cd /d "%~dp0edurentbackend"

echo Checking for compiled classes...
if not exist "target\classes" (
    echo Compiled classes not found. Please compile the project first using your IDE.
    echo Or install Maven and run: mvn clean install
    pause
    exit /b 1
)

echo.
echo Starting Spring Boot Application...
echo Backend will be available at: http://localhost:8080
echo Press Ctrl+C to stop the server
echo.

java -cp "target/classes;%USERPROFILE%\.m2\repository\*" com.edurent.crc.CrcApplication

pause
