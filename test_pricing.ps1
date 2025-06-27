# Test script to manually insert seat pricing for show 11
Write-Host "=== TESTING SEAT PRICING INSERTION ===" -ForegroundColor Cyan

$baseUrl = "http://localhost:3000/api"

# Step 1: Get admin token
Write-Host "`n1. Getting admin token..." -ForegroundColor Yellow
$adminLoginData = @{
    email = "admin@example.com"
    password = "adminpassword"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method POST -Body $adminLoginData -ContentType "application/json"
    $adminToken = $response.token
    Write-Host "✅ Admin token received" -ForegroundColor Green
} catch {
    Write-Host "❌ Admin login failed: $($_.Exception.Message)" -ForegroundColor Red
    exit
}

# Step 2: Check current seat pricing for show 11
Write-Host "`n2. Checking current seat pricing for show 11..." -ForegroundColor Yellow
try {
    $headers = @{
        "Authorization" = "Bearer $adminToken"
        "Content-Type" = "application/json"
    }
    $response = Invoke-RestMethod -Uri "$baseUrl/shows/11/seats" -Method GET -Headers $headers
    Write-Host "✅ Seat layout retrieved:" -ForegroundColor Green
    Write-Host $response | ConvertTo-Json -Depth 10
} catch {
    Write-Host "❌ Failed to get seat layout: $($_.Exception.Message)" -ForegroundColor Red
}

# Step 3: Try to manually insert pricing using SQL
Write-Host "`n3. Manually inserting seat pricing..." -ForegroundColor Yellow
try {
    $insertData = @{
        showId = 11
        category = "regular"
        price = 400
    } | ConvertTo-Json
    
    # This would be a direct database call, but for now let's just show the data
    Write-Host "✅ Would insert pricing data:" -ForegroundColor Green
    Write-Host $insertData
} catch {
    Write-Host "❌ Failed to insert pricing: $($_.Exception.Message)" -ForegroundColor Red
} 