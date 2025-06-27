# Comprehensive API Test Script for Cinema Booking Platform
$baseUrl = "http://localhost:3000"
$adminToken = ""
$userToken = ""

Write-Host "=== Cinema Booking Platform API Tests ===" -ForegroundColor Green
Write-Host ""

# 1. Health Check
Write-Host "1. Testing Health Check API..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/health" -Method GET
    Write-Host "SUCCESS - Health Check: $($response.message)" -ForegroundColor Green
} catch {
    Write-Host "FAILED - Health Check: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# 2. Authentication APIs
Write-Host "2. Testing Authentication APIs..." -ForegroundColor Yellow

# Admin Login
try {
    $adminLoginBody = @{
        email = "admin@example.com"
        password = "adminpassword"
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method POST -Body $adminLoginBody -ContentType "application/json"
    $adminToken = $response.token
    Write-Host "SUCCESS - Admin Login: $($response.user.email)" -ForegroundColor Green
} catch {
    Write-Host "FAILED - Admin Login: $($_.Exception.Message)" -ForegroundColor Red
}

# User Login
try {
    $userLoginBody = @{
        email = "john@example.com"
        password = "securePassword123"
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method POST -Body $userLoginBody -ContentType "application/json"
    $userToken = $response.token
    Write-Host "SUCCESS - User Login: $($response.user.email)" -ForegroundColor Green
} catch {
    Write-Host "FAILED - User Login: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# 3. Location APIs
Write-Host "3. Testing Location APIs..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/cities" -Method GET
    Write-Host "SUCCESS - Cities: $($response.cities.Count) cities found" -ForegroundColor Green
} catch {
    Write-Host "FAILED - Cities: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# 4. Movie APIs
Write-Host "4. Testing Movie APIs..." -ForegroundColor Yellow

# Get Movies
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/movies?city=1&language=English&genre=Action&format=IMAX" -Method GET
    Write-Host "SUCCESS - Movies: $($response.movies.Count) movies found" -ForegroundColor Green
} catch {
    Write-Host "FAILED - Movies: $($_.Exception.Message)" -ForegroundColor Red
}

# Get Movie Details
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/movies/1" -Method GET
    Write-Host "SUCCESS - Movie Details: $($response.movie.title)" -ForegroundColor Green
} catch {
    Write-Host "FAILED - Movie Details: $($_.Exception.Message)" -ForegroundColor Red
}

# Get Upcoming Movies
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/movies/upcoming" -Method GET
    Write-Host "SUCCESS - Upcoming Movies: $($response.movies.Count) movies found" -ForegroundColor Green
} catch {
    Write-Host "FAILED - Upcoming Movies: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# 5. Theater APIs
Write-Host "5. Testing Theater APIs..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/theaters?cityId=1" -Method GET
    Write-Host "SUCCESS - Theaters: $($response.theaters.Count) theaters found" -ForegroundColor Green
} catch {
    Write-Host "FAILED - Theaters: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# 6. Show APIs
Write-Host "6. Testing Show APIs..." -ForegroundColor Yellow

# Get Shows
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/shows?movieId=1&cityId=1&date=2024-01-25" -Method GET
    Write-Host "SUCCESS - Shows: $($response.shows.Count) shows found" -ForegroundColor Green
} catch {
    Write-Host "FAILED - Shows: $($_.Exception.Message)" -ForegroundColor Red
}

# Get Show Seats
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/shows/1/seats" -Method GET
    Write-Host "SUCCESS - Show Seats: Available seats found" -ForegroundColor Green
} catch {
    Write-Host "FAILED - Show Seats: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# 7. F&B APIs
Write-Host "7. Testing F&B APIs..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/fnb/menu" -Method GET
    Write-Host "SUCCESS - F&B Menu: $($response.menu.Count) items found" -ForegroundColor Green
} catch {
    Write-Host "FAILED - F&B Menu: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# 8. Admin APIs
Write-Host "8. Testing Admin APIs..." -ForegroundColor Yellow

# Create Movie
try {
    $headers = @{Authorization = "Bearer $adminToken"; "Content-Type" = "application/json"}
    $movieBody = @{
        title = "Test Movie $(Get-Date -Format 'yyyyMMddHHmmss')"
        description = "A test movie for API testing"
        director = "Test Director"
        producer = "Test Producer"
        cast = @("Test Actor 1", "Test Actor 2")
        duration_mins = 120
        genre = @("Action", "Drama")
        language = @("English")
        format = @("2D", "3D", "IMAX")
        release_date = "2024-06-01"
        rating = "PG-13"
        poster_url = "https://example.com/poster.jpg"
        trailer_url = "https://example.com/trailer.mp4"
        imdb_rating = 7.5
        is_upcoming = $false
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "$baseUrl/api/admin/movies" -Method POST -Headers $headers -Body $movieBody
    Write-Host "SUCCESS - Create Movie: ID $($response.movieId)" -ForegroundColor Green
} catch {
    Write-Host "FAILED - Create Movie: $($_.Exception.Message)" -ForegroundColor Red
}

# Create Show
try {
    $showBody = @{
        movieId = 1
        screenId = 1
        theaterId = 1
        showDate = "2030-01-02"
        showTime = "12:00"
        basePrice = 250
        format = "IMAX"
        language = "English"
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "$baseUrl/api/admin/shows" -Method POST -Headers $headers -Body $showBody
    Write-Host "SUCCESS - Create Show: ID $($response.showId)" -ForegroundColor Green
} catch {
    Write-Host "FAILED - Create Show: $($_.Exception.Message)" -ForegroundColor Red
}

# Update Show
try {
    $updateBody = @{
        basePrice = 300
        showTime = "14:00"
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "$baseUrl/api/admin/shows/1" -Method PUT -Headers $headers -Body $updateBody
    Write-Host "SUCCESS - Update Show" -ForegroundColor Green
} catch {
    Write-Host "FAILED - Update Show: $($_.Exception.Message)" -ForegroundColor Red
}

# Get Occupancy Reports
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/admin/reports/occupancy" -Method GET -Headers $headers
    Write-Host "SUCCESS - Occupancy Reports: $($response.reports.Count) reports found" -ForegroundColor Green
} catch {
    Write-Host "FAILED - Occupancy Reports: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# 9. Booking APIs
Write-Host "9. Testing Booking APIs..." -ForegroundColor Yellow

# Create Booking
try {
    $bookingHeaders = @{Authorization = "Bearer $userToken"; "Content-Type" = "application/json"}
    $bookingBody = @{
        showId = 1
        seats = @("A1", "A2")
        userDetails = @{
            email = "john@example.com"
            mobile = "+919876543210"
        }
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "$baseUrl/api/bookings/create" -Method POST -Headers $bookingHeaders -Body $bookingBody
    Write-Host "SUCCESS - Create Booking: $($response.bookingId)" -ForegroundColor Green
} catch {
    Write-Host "FAILED - Create Booking: $($_.Exception.Message)" -ForegroundColor Red
}

# Get User Bookings
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/bookings" -Method GET -Headers $bookingHeaders
    Write-Host "SUCCESS - Get Bookings: $($response.bookings.Count) bookings found" -ForegroundColor Green
} catch {
    Write-Host "FAILED - Get Bookings: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# 10. F&B Order APIs
Write-Host "10. Testing F&B Order APIs..." -ForegroundColor Yellow
try {
    $fnbBody = @{
        bookingId = "PVR123456"
        items = @(
            @{itemId = 1; quantity = 2},
            @{itemId = 5; quantity = 2}
        )
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "$baseUrl/api/fnb/order" -Method POST -Headers $bookingHeaders -Body $fnbBody
    Write-Host "SUCCESS - F&B Order: $($response.orderId)" -ForegroundColor Green
} catch {
    Write-Host "FAILED - F&B Order: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# 11. Payment APIs
Write-Host "11. Testing Payment APIs..." -ForegroundColor Yellow

# Initiate Payment
try {
    $paymentBody = @{
        bookingId = "PVR123456"
        includesFnb = $true
        paymentMethod = "card"
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "$baseUrl/api/payments/initiate" -Method POST -Headers $bookingHeaders -Body $paymentBody
    Write-Host "SUCCESS - Initiate Payment: $($response.paymentId)" -ForegroundColor Green
} catch {
    Write-Host "FAILED - Initiate Payment: $($_.Exception.Message)" -ForegroundColor Red
}

# Confirm Payment
try {
    $confirmBody = @{
        bookingId = "PVR123456"
        status = "success"
        transactionId = "TXN123456789"
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "$baseUrl/api/payments/confirm" -Method POST -Headers $bookingHeaders -Body $confirmBody
    Write-Host "SUCCESS - Confirm Payment" -ForegroundColor Green
} catch {
    Write-Host "FAILED - Confirm Payment: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

Write-Host "=== API Testing Complete ===" -ForegroundColor Green
Write-Host "Admin Token: $($adminToken.Substring(0, [Math]::Min(20, $adminToken.Length)))..." -ForegroundColor Cyan
Write-Host "User Token: $($userToken.Substring(0, [Math]::Min(20, $userToken.Length)))..." -ForegroundColor Cyan 