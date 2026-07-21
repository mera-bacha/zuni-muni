@echo off
cd /d "%~dp0"
echo.
echo Luxury Proposal Website
echo Open http://localhost:8080 in your browser.
echo Press Ctrl+C to stop the server.
echo.
py -3 -m http.server 8080 2>nul || python -m http.server 8080
pause
