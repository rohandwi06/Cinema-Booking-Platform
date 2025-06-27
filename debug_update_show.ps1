# Debug script for Update Show endpoint
Write-Host "Debugging Update Show endpoint..." -ForegroundColor Yellow

# Step 1: Get admin token
Write-Host "`n1. Getting admin token..." -ForegroundColor Cyan
$adminLoginData = @{
    email = "admin@example.com"
    password = "adminpassword"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/login" -Method POST -Body $adminLoginData -ContentType "application/json"
    $adminToken = $response.token
    Write-Host "✅ Admin token received" -ForegroundColor Green
} catch {
    Write-Host "❌ Admin login failed: $($_.Exception.Message)" -ForegroundColor Red
    exit
}

# Step 2: Test update show with detailed error handling
Write-Host "`n2. Testing Update Show..." -ForegroundColor Cyan
$updateShowData = @{
    show_time = "16:00"
    base_price = 350
} | ConvertTo-Json

try {
    $headers = @{
        "Authorization" = "Bearer $adminToken"
        "Content-Type" = "application/json"
    }
    
    Write-Host "Request URL: http://localhost:3000/api/shows/1" -ForegroundColor Gray
    Write-Host "Request Body: $updateShowData" -ForegroundColor Gray
    Write-Host "Headers: $($headers | ConvertTo-Json)" -ForegroundColor Gray
    
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/shows/1" -Method PUT -Body $updateShowData -Headers $headers
    Write-Host "✅ Update show successful: $($response | ConvertTo-Json)" -ForegroundColor Green
} catch {
    Write-Host "❌ Update show failed" -ForegroundColor Red
    Write-Host "Error Status: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
    Write-Host "Error Message: $($_.Exception.Message)" -ForegroundColor Red
    
    # Try to get the response body for more details
    try {
        $errorResponse = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($errorResponse)
        $errorBody = $reader.ReadToEnd()
        Write-Host "Error Response Body: $errorBody" -ForegroundColor Red
    } catch {
        Write-Host "Could not read error response body" -ForegroundColor Yellow
    }
}

# Step 3: Test with different show ID
Write-Host "`n3. Testing Update Show with ID 11..." -ForegroundColor Cyan
try {
    $headers = @{
        "Authorization" = "Bearer $adminToken"
        "Content-Type" = "application/json"
    }
    
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/shows/11" -Method PUT -Body $updateShowData -Headers $headers
    Write-Host "✅ Update show 11 successful: $($response | ConvertTo-Json)" -ForegroundColor Green
} catch {
    Write-Host "❌ Update show 11 failed: $($_.Exception.Message)" -ForegroundColor Red
} 