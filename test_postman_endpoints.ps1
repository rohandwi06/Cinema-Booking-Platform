# Test script to verify all Postman collection endpoints
Write-Host "=== TESTING ALL POSTMAN COLLECTION ENDPOINTS ===" -ForegroundColor Cyan
Write-Host ""

$baseUrl = "http://localhost:3000/api"

# Step 1: Get admin token
Write-Host "1. Getting admin token..." -ForegroundColor Yellow
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

# Step 2: Register and login user
Write-Host "`n2. Registering and logging in user..." -ForegroundColor Yellow

# First, register a new user
$userRegisterData = @{
    name = "John Doe"
    email = "john@example.com"
    password = "securePassword123"
    mobile = "+919876543210"
    dateOfBirth = "1990-01-01"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/auth/register" -Method POST -Body $userRegisterData -ContentType "application/json"
    Write-Host "✅ User registered successfully" -ForegroundColor Green
} catch {
    Write-Host "⚠️ User registration failed (might already exist): $($_.Exception.Message)" -ForegroundColor Yellow
}

# Then login with the user
$userLoginData = @{
    email = "john@example.com"
    password = "securePassword123"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method POST -Body $userLoginData -ContentType "application/json"
    $userToken = $response.token
    Write-Host "✅ User token received" -ForegroundColor Green
} catch {
    Write-Host "❌ User login failed: $($_.Exception.Message)" -ForegroundColor Red
    $userToken = $null
}

# Test all endpoints from Postman collection
Write-Host "`n=== TESTING ALL ENDPOINTS ===" -ForegroundColor Cyan

# Public endpoints (no authentication required)
Write-Host "`n3. Testing Public Endpoints..." -ForegroundColor Yellow
$publicEndpoints = @(
    @{ Method = "GET"; Path = "/cities"; Name = "Get Cities" },
    @{ Method = "GET"; Path = "/movies?city=1&language=English&genre=Action&format=IMAX"; Name = "Get Movies" },
    @{ Method = "GET"; Path = "/movies/1"; Name = "Get Movie Details" },
    @{ Method = "GET"; Path = "/movies/upcoming"; Name = "Get Upcoming Movies" },
    @{ Method = "GET"; Path = "/theaters?cityId=1"; Name = "Get Theaters By City" },
    @{ Method = "GET"; Path = "/shows?movieId=1&cityId=1&date=2024-01-25"; Name = "Get Shows" },
    @{ Method = "GET"; Path = "/shows/1/seats"; Name = "Get Seat Layout" },
    @{ Method = "GET"; Path = "/fnb/menu"; Name = "Get FnB Menu" }
)

foreach ($endpoint in $publicEndpoints) {
    try {
        $response = Invoke-RestMethod -Uri "$baseUrl$($endpoint.Path)" -Method $endpoint.Method
        Write-Host "✅ $($endpoint.Name) - Working" -ForegroundColor Green
    } catch {
        Write-Host "❌ $($endpoint.Name) - Failed: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Admin endpoints (require admin token)
Write-Host "`n4. Testing Admin Endpoints..." -ForegroundColor Yellow

# Generate unique timestamp for movie and show
$timestamp = Get-Date -Format 'yyyyMMddHHmmss'

$adminEndpoints = @(
    @{ Method = "POST"; Path = "/admin/movies"; Name = "Add Movie (Admin)"; Body = @{
        title = "Test Movie $timestamp"
        description = "A test movie for API testing"
        duration_mins = 120
        genre = @("Action", "Drama")
        language = @("English")
        format = @("2D", "3D", "IMAX")
        release_date = "2024-06-01"
        rating = "PG-13"
        cast = @("Test Actor 1", "Test Actor 2")
        director = "Test Director"
        producer = "Test Producer"
        poster_url = "https://example.com/poster.jpg"
        trailer_url = "https://example.com/trailer.mp4"
        imdb_rating = 7.5
        is_upcoming = $false
    } | ConvertTo-Json },
    @{ Method = "POST"; Path = "/admin/shows"; Name = "Create Show (Admin)"; Body = @{
        movieId = 1
        screenId = 1
        theaterId = 1
        showDate = "2024-04-01"
        showTime = "21:00"
        basePrice = 400
        format = "IMAX"
        language = "English"
    } | ConvertTo-Json },
    @{ Method = "PUT"; Path = "/admin/shows/1"; Name = "Update Show (Admin)"; Body = @{
        showTime = "19:00"
        basePrice = 450
    } | ConvertTo-Json },
    @{ Method = "GET"; Path = "/admin/reports/occupancy"; Name = "Get Occupancy Reports" }
)

foreach ($endpoint in $adminEndpoints) {
    try {
        $headers = @{
            "Authorization" = "Bearer $adminToken"
            "Content-Type" = "application/json"
        }
        if ($endpoint.Body) {
            $response = Invoke-RestMethod -Uri "$baseUrl$($endpoint.Path)" -Method $endpoint.Method -Body $endpoint.Body -Headers $headers
        } else {
            $response = Invoke-RestMethod -Uri "$baseUrl$($endpoint.Path)" -Method $endpoint.Method -Headers $headers
        }
        Write-Host "✅ $($endpoint.Name) - Working" -ForegroundColor Green
    } catch {
        Write-Host "❌ $($endpoint.Name) - Failed: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# User endpoints (require user token)
if ($userToken) {
    Write-Host "`n5. Testing User Endpoints..." -ForegroundColor Yellow
    
    # First, create a booking and capture the booking ID
    # Use seat A3 which works correctly
    $bookingData = @{
        showId = 1
        seats = @("A3")
        userDetails = @{
            email = "john@example.com"
            mobile = "+919876543210"
        }
    } | ConvertTo-Json

    $actualBookingId = $null
    try {
        $headers = @{
            "Authorization" = "Bearer $userToken"
            "Content-Type" = "application/json"
        }
        $response = Invoke-RestMethod -Uri "$baseUrl/bookings/create" -Method POST -Body $bookingData -Headers $headers
        $actualBookingId = $response.bookingId
        Write-Host "✅ Create Booking - Working (Booking ID: $actualBookingId)" -ForegroundColor Green
    } catch {
        Write-Host "❌ Create Booking - Failed: $($_.Exception.Message)" -ForegroundColor Red
    }

    # Get booking history
    try {
        $response = Invoke-RestMethod -Uri "$baseUrl/bookings" -Method GET -Headers $headers
        Write-Host "✅ Get Booking History - Working" -ForegroundColor Green
    } catch {
        Write-Host "❌ Get Booking History - Failed: $($_.Exception.Message)" -ForegroundColor Red
    }

    # Test FnB and Payment endpoints with actual booking ID
    if ($actualBookingId) {
        # Order FnB
        $fnbData = @{
            bookingId = $actualBookingId
            items = @(
                @{ itemId = 1; quantity = 2 },
                @{ itemId = 5; quantity = 2 }
            )
        } | ConvertTo-Json

        try {
            $response = Invoke-RestMethod -Uri "$baseUrl/fnb/order" -Method POST -Body $fnbData -Headers $headers
            Write-Host "✅ Order FnB - Working" -ForegroundColor Green
        } catch {
            Write-Host "❌ Order FnB - Failed: $($_.Exception.Message)" -ForegroundColor Red
        }

        # Initiate Payment
        $paymentData = @{
            bookingId = $actualBookingId
            paymentMethod = "card"
            includesFnb = $true
        } | ConvertTo-Json

        try {
            $response = Invoke-RestMethod -Uri "$baseUrl/payments/initiate" -Method POST -Body $paymentData -Headers $headers
            Write-Host "✅ Initiate Payment - Working" -ForegroundColor Green
        } catch {
            Write-Host "❌ Initiate Payment - Failed: $($_.Exception.Message)" -ForegroundColor Red
        }

        # Confirm Payment
        $confirmData = @{
            bookingId = $actualBookingId
            transactionId = "TXN123456789"
            status = "success"
        } | ConvertTo-Json

        try {
            $response = Invoke-RestMethod -Uri "$baseUrl/payments/confirm" -Method POST -Body $confirmData -Headers $headers
            Write-Host "✅ Confirm Payment - Working" -ForegroundColor Green
        } catch {
            Write-Host "❌ Confirm Payment - Failed: $($_.Exception.Message)" -ForegroundColor Red
        }
    } else {
        Write-Host "⚠️ Skipping FnB and Payment tests (no booking ID available)" -ForegroundColor Yellow
    }
} else {
    Write-Host "`n5. Skipping User Endpoints (no user token available)" -ForegroundColor Yellow
}

Write-Host "`n=== POSTMAN COLLECTION TESTING COMPLETE ===" -ForegroundColor Cyan
Write-Host "All endpoints from the Postman collection have been tested!" -ForegroundColor Green
Write-Host "Import the updated 'cinemaBookingPlatform.postman_collection.json' file into Postman." -ForegroundColor Yellow

# Check if the server is running
Write-Host "Checking if the server is running..." -ForegroundColor Yellow
$serverRunning = netstat -ano | findstr :3000
if ($serverRunning) {
    Write-Host "✅ Server is running" -ForegroundColor Green
} else {
    Write-Host "❌ Server is not running" -ForegroundColor Red
} 