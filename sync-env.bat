@echo off
echo Syncing .env files...
copy .env server\.env
echo Environment files synchronized!
echo.
echo Root .env file: %cd%\.env
echo Server .env file: %cd%\server\.env
echo.
pause
