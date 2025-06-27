# Debug Booking Creation Script
Write-Host "=== Debug Booking Creation ===" -ForegroundColor Green

# Step 1: Login as user
Write-Host "1. Logging in as user..." -ForegroundColor Yellow
$loginResponse = Invoke-WebRequest -Uri "http://localhost:3000/api/auth/login" -Method POST -Headers @{"Content-Type"="application/json"} -Body '{"email":"john@example.com","password":"securePassword123"}'
$loginData = $loginResponse.Content | ConvertFrom-Json
$userToken = $loginData.token
Write-Host "User login successful: $($loginData.success)" -ForegroundColor Green

# Step 2: Get shows
Write-Host "2. Getting shows..." -ForegroundColor Yellow
$showsResponse = Invoke-WebRequest -Uri "http://localhost:3000/api/shows?movieId=1&cityId=1&date=2024-01-25" -Method GET
$showsData = $showsResponse.Content | ConvertFrom-Json
Write-Host "Shows found: $($showsData.shows.Count)" -ForegroundColor Green

# Step 3: Get seat layout
Write-Host "3. Getting seat layout..." -ForegroundColor Yellow
$seatsResponse = Invoke-WebRequest -Uri "http://localhost:3000/api/shows/1/seats" -Method GET
$seatsData = $seatsResponse.Content | ConvertFrom-Json
Write-Host "Seat layout retrieved: $($seatsData.success)" -ForegroundColor Green

# Step 4: Try to create booking
Write-Host "4. Creating booking..." -ForegroundColor Yellow
$bookingData = @{
    showId = 1
    seats = @("A1", "A2")
    userDetails = @{
        email = "john@example.com"
        mobile = "+919876543210"
    }
} | ConvertTo-Json -Depth 3

try {
    $bookingResponse = Invoke-WebRequest -Uri "http://localhost:3000/api/bookings/create" -Method POST -Headers @{"Content-Type"="application/json"; "Authorization"="Bearer $userToken"} -Body $bookingData
    $bookingResult = $bookingResponse.Content | ConvertFrom-Json
    Write-Host "Booking creation successful: $($bookingResult.success)" -ForegroundColor Green
    if ($bookingResult.success) {
        Write-Host "Booking ID: $($bookingResult.bookingId)" -ForegroundColor Green
    }
} catch {
    Write-Host "Booking creation failed with status: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $errorContent = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($errorContent)
        $errorBody = $reader.ReadToEnd()
        Write-Host "Error body: $errorBody" -ForegroundColor Red
    }
}

# Step 5: Check user bookings
Write-Host "5. Checking user bookings..." -ForegroundColor Yellow
$bookingsResponse = Invoke-WebRequest -Uri "http://localhost:3000/api/bookings" -Method GET -Headers @{"Authorization"="Bearer $userToken"}
$bookingsData = $bookingsResponse.Content | ConvertFrom-Json
Write-Host "User bookings found: $($bookingsData.bookings.Count)" -ForegroundColor Green

Write-Host "=== Debug Complete ===" -ForegroundColor Green 