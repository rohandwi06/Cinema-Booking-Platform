# Comprehensive test script with completely unique data
Write-Host "=== COMPREHENSIVE API TESTING WITH UNIQUE DATA ===" -ForegroundColor Cyan
Write-Host ""

$baseUrl = "http://localhost:3000/api"

# Generate unique timestamp for this test run
$timestamp = Get-Date -Format "yyyyMMddHHmmss"
$randomSuffix = Get-Random -Minimum 1000 -Maximum 9999

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

# Step 2: Get user token
Write-Host "`n2. Getting user token..." -ForegroundColor Yellow
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
    exit
}

# Step 3: Test Public Endpoints
Write-Host "`n3. Testing Public Endpoints..." -ForegroundColor Yellow

# Get Cities
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/cities" -Method GET
    Write-Host "✅ Get Cities - Working" -ForegroundColor Green
} catch {
    Write-Host "❌ Get Cities - Failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Get Movies
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/movies?city=1&language=English&genre=Action&format=IMAX" -Method GET
    Write-Host "✅ Get Movies - Working" -ForegroundColor Green
} catch {
    Write-Host "❌ Get Movies - Failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Get Movie Details
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/movies/1" -Method GET
    Write-Host "✅ Get Movie Details - Working" -ForegroundColor Green
} catch {
    Write-Host "❌ Get Movie Details - Failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Get Upcoming Movies
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/movies/upcoming" -Method GET
    Write-Host "✅ Get Upcoming Movies - Working" -ForegroundColor Green
} catch {
    Write-Host "❌ Get Upcoming Movies - Failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Get Theaters By City
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/theaters?cityId=1" -Method GET
    Write-Host "✅ Get Theaters By City - Working" -ForegroundColor Green
} catch {
    Write-Host "❌ Get Theaters By City - Failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Get Shows
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/shows?movieId=1&cityId=1&date=2024-01-25" -Method GET
    Write-Host "✅ Get Shows - Working" -ForegroundColor Green
} catch {
    Write-Host "❌ Get Shows - Failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Get Seat Layout
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/shows/1/seats" -Method GET
    Write-Host "✅ Get Seat Layout - Working" -ForegroundColor Green
} catch {
    Write-Host "❌ Get Seat Layout - Failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Get FnB Menu
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/fnb/menu" -Method GET
    Write-Host "✅ Get FnB Menu - Working" -ForegroundColor Green
} catch {
    Write-Host "❌ Get FnB Menu - Failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Step 4: Test Admin Endpoints
Write-Host "`n4. Testing Admin Endpoints..." -ForegroundColor Yellow

# Add Movie (Admin) - Use unique title
$uniqueMovieTitle = "Unique Movie $timestamp$randomSuffix"
$movieData = @{
    title = $uniqueMovieTitle
    description = "A unique movie for API testing"
    director = "Unique Director"
    producer = "Unique Producer"
    cast = @("Unique Actor 1", "Unique Actor 2")
    genre = @("Action", "Drama")
    language = @("English")
    format = @("2D", "3D", "IMAX")
    duration_mins = 120
    release_date = "2024-06-01"
    rating = "PG-13"
    imdb_rating = 7.5
    poster_url = "https://example.com/poster.jpg"
    trailer_url = "https://example.com/trailer.mp4"
    is_upcoming = $false
} | ConvertTo-Json

try {
    $headers = @{
        "Authorization" = "Bearer $adminToken"
        "Content-Type" = "application/json"
    }
    $response = Invoke-RestMethod -Uri "$baseUrl/admin/movies" -Method POST -Body $movieData -Headers $headers
    $newMovieId = $response.movieId
    Write-Host "✅ Add Movie (Admin) - Working (Movie ID: $newMovieId)" -ForegroundColor Green
} catch {
    Write-Host "❌ Add Movie (Admin) - Failed: $($_.Exception.Message)" -ForegroundColor Red
    $newMovieId = 1  # Fallback to existing movie
}

# Create Show (Admin) - Use unique date and time
$uniqueShowDate = (Get-Date).AddDays(30).ToString("yyyy-MM-dd")
$uniqueShowTime = "14:30"
$showData = @{
    movieId = $newMovieId
    theaterId = 1
    screenId = 1
    showDate = $uniqueShowDate
    showTime = $uniqueShowTime
    format = "IMAX"
    language = "English"
    basePrice = 400
} | ConvertTo-Json

try {
    $headers = @{
        "Authorization" = "Bearer $adminToken"
        "Content-Type" = "application/json"
    }
    $response = Invoke-RestMethod -Uri "$baseUrl/admin/shows" -Method POST -Body $showData -Headers $headers
    $newShowId = $response.showId
    Write-Host "✅ Create Show (Admin) - Working (Show ID: $newShowId)" -ForegroundColor Green
} catch {
    Write-Host "❌ Create Show (Admin) - Failed: $($_.Exception.Message)" -ForegroundColor Red
    $newShowId = 1  # Fallback to existing show
}

# Update Show (Admin)
$updateShowData = @{
    basePrice = 450
    showTime = "15:00"
} | ConvertTo-Json

try {
    $headers = @{
        "Authorization" = "Bearer $adminToken"
        "Content-Type" = "application/json"
    }
    $response = Invoke-RestMethod -Uri "$baseUrl/admin/shows/$newShowId" -Method PUT -Body $updateShowData -Headers $headers
    Write-Host "✅ Update Show (Admin) - Working" -ForegroundColor Green
} catch {
    Write-Host "❌ Update Show (Admin) - Failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Get Occupancy Reports
try {
    $headers = @{
        "Authorization" = "Bearer $adminToken"
        "Content-Type" = "application/json"
    }
    $response = Invoke-RestMethod -Uri "$baseUrl/admin/reports/occupancy" -Method GET -Headers $headers
    Write-Host "✅ Get Occupancy Reports - Working" -ForegroundColor Green
} catch {
    Write-Host "❌ Get Occupancy Reports - Failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Step 5: Test User Endpoints
Write-Host "`n5. Testing User Endpoints..." -ForegroundColor Yellow

# Create Booking - Use the new show and available seats
$bookingData = @{
    showId = $newShowId
    seats = @("A1", "A2")
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

# Get Booking History
try {
    $headers = @{
        "Authorization" = "Bearer $userToken"
        "Content-Type" = "application/json"
    }
    $response = Invoke-RestMethod -Uri "$baseUrl/bookings" -Method GET -Headers $headers
    Write-Host "✅ Get Booking History - Working" -ForegroundColor Green
} catch {
    Write-Host "❌ Get Booking History - Failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Order FnB - Only if booking was successful
if ($actualBookingId) {
    $fnbData = @{
        bookingId = $actualBookingId
        items = @(
            @{ itemId = 1; quantity = 2 },
            @{ itemId = 5; quantity = 2 }
        )
    } | ConvertTo-Json

    try {
        $headers = @{
            "Authorization" = "Bearer $userToken"
            "Content-Type" = "application/json"
        }
        $response = Invoke-RestMethod -Uri "$baseUrl/fnb/order" -Method POST -Body $fnbData -Headers $headers
        Write-Host "✅ Order FnB - Working" -ForegroundColor Green
    } catch {
        Write-Host "❌ Order FnB - Failed: $($_.Exception.Message)" -ForegroundColor Red
    }

    # Initiate Payment
    $paymentData = @{
        bookingId = $actualBookingId
        includesFnb = $true
        paymentMethod = "card"
    } | ConvertTo-Json

    try {
        $headers = @{
            "Authorization" = "Bearer $userToken"
            "Content-Type" = "application/json"
        }
        $response = Invoke-RestMethod -Uri "$baseUrl/payments/initiate" -Method POST -Body $paymentData -Headers $headers
        Write-Host "✅ Initiate Payment - Working" -ForegroundColor Green
    } catch {
        Write-Host "❌ Initiate Payment - Failed: $($_.Exception.Message)" -ForegroundColor Red
    }

    # Confirm Payment
    $confirmPaymentData = @{
        bookingId = $actualBookingId
        status = "success"
        transactionId = "TXN$timestamp$randomSuffix"
    } | ConvertTo-Json

    try {
        $headers = @{
            "Authorization" = "Bearer $userToken"
            "Content-Type" = "application/json"
        }
        $response = Invoke-RestMethod -Uri "$baseUrl/payments/confirm" -Method POST -Body $confirmPaymentData -Headers $headers
        Write-Host "✅ Confirm Payment - Working" -ForegroundColor Green
    } catch {
        Write-Host "❌ Confirm Payment - Failed: $($_.Exception.Message)" -ForegroundColor Red
    }
} else {
    Write-Host "⚠️ FnB and Payment tests skipped - No booking created" -ForegroundColor Yellow
}

Write-Host "`n=== TEST COMPLETED ===" -ForegroundColor Cyan 