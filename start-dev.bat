@echo off
REM Restaurant Management System Startup Script
echo Starting Restaurant Management System...

REM Kill any existing Node.js processes
echo Cleaning up existing processes...
taskkill /F /IM node.exe 2>nul || echo No existing processes found

REM Wait a moment for cleanup
timeout /t 2 /nobreak >nul

REM Set environment variables
echo Setting up environment...
set NEXT_PUBLIC_API_URL=http://localhost:3001/api
set NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_ROcWTytWkpNMYw

REM Create server .env file
echo Creating server configuration...
(
echo PORT=3001
echo DATABASE_URL=mongodb+srv://restodb:restodbaccess@cluster0.g0ugzmi.mongodb.net/ernakulam_dine_flow?retryWrites=true^&w=majority^&appName=Cluster0
echo JWT_SECRET=your-super-secret-jwt-key-here
echo RAZORPAY_KEY_ID=rzp_test_ROcWTytWkpNMYw
echo RAZORPAY_KEY_SECRET=D7Rg3jYzCEq0ZoDudo0GWGt0
echo NODE_ENV=development
echo CLIENT_URL=http://localhost:3000
) > server\.env

REM Create frontend .env.local file
echo Creating frontend configuration...
(
echo NEXT_PUBLIC_API_URL=http://localhost:3001/api
echo NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_ROcWTytWkpNMYw
) > .env.local

REM Start the servers
echo Starting servers...
echo    Frontend: http://localhost:3000
echo    Backend:  http://localhost:3001
echo.

REM Start backend first
echo Starting backend server...
start "Backend Server" cmd /k "cd server && npm run dev"

REM Wait for backend to start
timeout /t 5 /nobreak >nul

REM Start frontend
echo Starting frontend server...
start "Frontend Server" cmd /k "npm run dev"

echo Servers started successfully!
echo Access your application at: http://localhost:3000
echo API available at: http://localhost:3001/api
echo.
echo Press any key to stop all servers...
pause >nul

REM Cleanup on exit
echo Stopping servers...
taskkill /F /IM node.exe 2>nul
echo Cleanup complete!
