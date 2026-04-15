# AutoML Studio - Full Stack Startup Script
# Run this from the project root: .\start.ps1

$ROOT = "C:\coding\FinalYearProject\MCAFINAL"
Set-Location $ROOT

# Refresh PATH so celery is found
$env:PATH = [System.Environment]::GetEnvironmentVariable("PATH","Machine") + ";" +
            [System.Environment]::GetEnvironmentVariable("PATH","User")

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   AutoML Studio - Starting All Services" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# == 1. Django ==
Write-Host "[1/3] Starting Django backend on port 8000..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command",
    "Set-Location '$ROOT'; python manage.py runserver 8000" `
    -WindowStyle Normal

Start-Sleep 3

# == 2. Celery Worker ==
Write-Host "[2/3] Starting Celery worker..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command",
    "Set-Location '$ROOT'; python -m celery -A mlplatform worker --loglevel=info --pool=solo" `
    -WindowStyle Normal

Start-Sleep 3

# == 3. Next.js ==
Write-Host "[3/3] Starting Next.js frontend on port 3000..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command",
    "Set-Location '$ROOT\frontend'; npm run dev" `
    -WindowStyle Normal

Start-Sleep 5

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  ALL SERVICES RUNNING!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "  Frontend:          http://localhost:3000" -ForegroundColor White
Write-Host "  Backend API:       http://localhost:8000/api/" -ForegroundColor White
Write-Host "  Django Admin:      http://localhost:8000/admin/" -ForegroundColor White
Write-Host ""
Write-Host "  Press Ctrl+C in each window to stop services" -ForegroundColor Gray
Write-Host ""

Write-Host "Press any key to exit this launcher..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
