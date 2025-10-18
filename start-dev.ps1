# Restaurant Management System Startup Script (PowerShell)
Write-Host "Starting Restaurant Management System..." -ForegroundColor Green

# Kill any existing Node.js processes
Write-Host "Cleaning up existing processes..." -ForegroundColor Yellow
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue

# Wait a moment for cleanup
Start-Sleep -Seconds 2

# Set environment variables
Write-Host "Setting up environment..." -ForegroundColor Cyan
$env:NEXT_PUBLIC_API_URL = "http://localhost:3001/api"
$env:NEXT_PUBLIC_RAZORPAY_KEY_ID = "rzp_test_ROcWTytWkpNMYw"

# Create server .env file
Write-Host "Creating server configuration..." -ForegroundColor Cyan
$serverEnvContent = "PORT=3001`nDATABASE_URL=mongodb+srv://restodb:restodbaccess@cluster0.g0ugzmi.mongodb.net/ernakulam_dine_flow?retryWrites=true&w=majority&appName=Cluster0`nJWT_SECRET=your-super-secret-jwt-key-here`nRAZORPAY_KEY_ID=rzp_test_ROcWTytWkpNMYw`nRAZORPAY_KEY_SECRET=D7Rg3jYzCEq0ZoDudo0GWGt0`nNODE_ENV=development`nCLIENT_URL=http://localhost:3000"
Set-Content -Path "server\.env" -Value $serverEnvContent

# Create frontend .env.local file
Write-Host "Creating frontend configuration..." -ForegroundColor Cyan
$frontendEnvContent = "NEXT_PUBLIC_API_URL=http://localhost:3001/api`nNEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_ROcWTytWkpNMYw"
Set-Content -Path ".env.local" -Value $frontendEnvContent

# Start the servers
Write-Host "Starting servers..." -ForegroundColor Green
Write-Host "   Frontend: http://localhost:3000" -ForegroundColor White
Write-Host "   Backend:  http://localhost:3001" -ForegroundColor White
Write-Host ""

# Start backend first
Write-Host "Starting backend server..." -ForegroundColor Yellow
Start-Process -FilePath "cmd" -ArgumentList "/k", "cd server && npm run dev" -WindowStyle Normal

# Wait for backend to start
Start-Sleep -Seconds 5

# Start frontend
Write-Host "Starting frontend server..." -ForegroundColor Yellow
Start-Process -FilePath "cmd" -ArgumentList "/k", "npm run dev" -WindowStyle Normal

Write-Host "Servers started successfully!" -ForegroundColor Green
Write-Host "Access your application at: http://localhost:3000" -ForegroundColor Cyan
Write-Host "API available at: http://localhost:3001/api" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press any key to stop all servers..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

# Cleanup on exit
Write-Host "Stopping servers..." -ForegroundColor Red
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Write-Host "Cleanup complete!" -ForegroundColor Green
