# Comprehensive API Test Script for Cinema Booking Platform
Write-Host "=== Cinema Booking Platform API Test ===" -ForegroundColor Green
Write-Host "Testing all APIs systematically..." -ForegroundColor Yellow

# Step 1: Health Check
Write-Host "`n1. Testing Health Check..." -ForegroundColor Cyan
try {
    $healthResponse = Invoke-WebRequest -Uri "http://localhost:3000/health" -Method GET
    Write-Host "✓ Health Check: $($healthResponse.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "✗ Health Check Failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Step 2: Admin Login
Write-Host "`n2. Testing Admin Login..." -ForegroundColor Cyan
try {
    $adminLoginResponse = Invoke-WebRequest -Uri "http://localhost:3000/api/auth/login" -Method POST -Headers @{"Content-Type"="application/json"} -Body '{"email":"admin@example.com","password":"adminpassword"}'
    $adminData = $adminLoginResponse.Content | ConvertFrom-Json
    $adminToken = $adminData.token
    Write-Host "✓ Admin Login: $($adminData.success)" -ForegroundColor Green
} catch {
    Write-Host "✗ Admin Login Failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Step 3: User Login
Write-Host "`n3. Testing User Login..." -ForegroundColor Cyan
try {
    $userLoginResponse = Invoke-WebRequest -Uri "http://localhost:3000/api/auth/login" -Method POST -Headers @{"Content-Type"="application/json"} -Body '{"email":"john@example.com","password":"securePassword123"}'
    $userData = $userLoginResponse.Content | ConvertFrom-Json
    $userToken = $userData.token
    Write-Host "✓ User Login: $($userData.success)" -ForegroundColor Green
} catch {
    Write-Host "✗ User Login Failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Step 4: Test Cities API
Write-Host "`n4. Testing Cities API..." -ForegroundColor Cyan
try {
    $citiesResponse = Invoke-WebRequest -Uri "http://localhost:3000/api/cities" -Method GET
    $citiesData = $citiesResponse.Content | ConvertFrom-Json
    Write-Host "✓ Cities API: $($citiesData.success) - Found $($citiesData.cities.Count) cities" -ForegroundColor Green
} catch {
    Write-Host "✗ Cities API Failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Step 5: Test Movies API
Write-Host "`n5. Testing Movies API..." -ForegroundColor Cyan
try {
    $moviesResponse = Invoke-WebRequest -Uri "http://localhost:3000/api/movies?city=1&language=English&genre=Action&format=IMAX" -Method GET
    $moviesData = $moviesResponse.Content | ConvertFrom-Json
    Write-Host "✓ Movies API: $($moviesData.success) - Found $($moviesData.movies.Count) movies" -ForegroundColor Green
} catch {
    Write-Host "✗ Movies API Failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Step 6: Test Movie Details API
Write-Host "`n6. Testing Movie Details API..." -ForegroundColor Cyan
try {
    $movieDetailsResponse = Invoke-WebRequest -Uri "http://localhost:3000/api/movies/1" -Method GET
    $movieDetailsData = $movieDetailsResponse.Content | ConvertFrom-Json
    Write-Host "✓ Movie Details API: $($movieDetailsData.success)" -ForegroundColor Green
} catch {
    Write-Host "✗ Movie Details API Failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Step 7: Test Upcoming Movies API
Write-Host "`n7. Testing Upcoming Movies API..." -ForegroundColor Cyan
try {
    $upcomingResponse = Invoke-WebRequest -Uri "http://localhost:3000/api/movies/upcoming" -Method GET
    $upcomingData = $upcomingResponse.Content | ConvertFrom-Json
    Write-Host "✓ Upcoming Movies API: $($upcomingData.success)" -ForegroundColor Green
} catch {
    Write-Host "✗ Upcoming Movies API Failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Step 8: Test Theaters API
Write-Host "`n8. Testing Theaters API..." -ForegroundColor Cyan
try {
    $theatersResponse = Invoke-WebRequest -Uri "http://localhost:3000/api/theaters?cityId=1" -Method GET
    $theatersData = $theatersResponse.Content | ConvertFrom-Json
    Write-Host "✓ Theaters API: $($theatersData.success) - Found $($theatersData.theaters.Count) theaters" -ForegroundColor Green
} catch {
    Write-Host "✗ Theaters API Failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Step 9: Test Shows API
Write-Host "`n9. Testing Shows API..." -ForegroundColor Cyan
try {
    $showsResponse = Invoke-WebRequest -Uri "http://localhost:3000/api/shows?movieId=1&cityId=1&date=2024-01-25" -Method GET
    $showsData = $showsResponse.Content | ConvertFrom-Json
    Write-Host "✓ Shows API: $($showsData.success) - Found $($showsData.shows.Count) shows" -ForegroundColor Green
} catch {
    Write-Host "✗ Shows API Failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Step 10: Test Seats API
Write-Host "`n10. Testing Seats API..." -ForegroundColor Cyan
try {
    $seatsResponse = Invoke-WebRequest -Uri "http://localhost:3000/api/shows/1/seats" -Method GET
    $seatsData = $seatsResponse.Content | ConvertFrom-Json
    Write-Host "✓ Seats API: $($seatsData.success)" -ForegroundColor Green
} catch {
    Write-Host "✗ Seats API Failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Step 11: Test FnB Menu API
Write-Host "`n11. Testing FnB Menu API..." -ForegroundColor Cyan
try {
    $fnbResponse = Invoke-WebRequest -Uri "http://localhost:3000/api/fnb/menu" -Method GET
    $fnbData = $fnbResponse.Content | ConvertFrom-Json
    Write-Host "✓ FnB Menu API: $($fnbData.success) - Found $($fnbData.menu.Count) items" -ForegroundColor Green
} catch {
    Write-Host "✗ FnB Menu API Failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Step 12: Test Admin Movie Creation
Write-Host "`n12. Testing Admin Movie Creation..." -ForegroundColor Cyan
try {
    $timestamp = Get-Date -Format "yyyyMMddHHmmss"
    $movieData = @{
        title = "Test Movie $timestamp"
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
    } | ConvertTo-Json -Depth 3

    $adminMovieResponse = Invoke-WebRequest -Uri "http://localhost:3000/api/admin/movies" -Method POST -Headers @{"Content-Type"="application/json"; "Authorization"="Bearer $adminToken"} -Body $movieData
    $adminMovieData = $adminMovieResponse.Content | ConvertFrom-Json
    Write-Host "✓ Admin Movie Creation: $($adminMovieData.success)" -ForegroundColor Green
} catch {
    Write-Host "✗ Admin Movie Creation Failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Step 13: Test Admin Show Creation
Write-Host "`n13. Testing Admin Show Creation..." -ForegroundColor Cyan
try {
    $showData = @{
        movieId = 1
        screenId = 1
        theaterId = 1
        showDate = "2024-02-01"
        showTime = "18:30"
        basePrice = 400
        format = "IMAX"
        language = "English"
    } | ConvertTo-Json

    $adminShowResponse = Invoke-WebRequest -Uri "http://localhost:3000/api/admin/shows" -Method POST -Headers @{"Content-Type"="application/json"; "Authorization"="Bearer $adminToken"} -Body $showData
    $adminShowData = $adminShowResponse.Content | ConvertFrom-Json
    Write-Host "✓ Admin Show Creation: $($adminShowData.success)" -ForegroundColor Green
} catch {
    Write-Host "✗ Admin Show Creation Failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Step 14: Test Admin Show Update
Write-Host "`n14. Testing Admin Show Update..." -ForegroundColor Cyan
try {
    $updateData = @{
        basePrice = 450
        showTime = "19:00"
    } | ConvertTo-Json

    $adminUpdateResponse = Invoke-WebRequest -Uri "http://localhost:3000/api/admin/shows/1" -Method PUT -Headers @{"Content-Type"="application/json"; "Authorization"="Bearer $adminToken"} -Body $updateData
    $adminUpdateData = $adminUpdateResponse.Content | ConvertFrom-Json
    Write-Host "✓ Admin Show Update: $($adminUpdateData.success)" -ForegroundColor Green
} catch {
    Write-Host "✗ Admin Show Update Failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Step 15: Test Admin Reports API
Write-Host "`n15. Testing Admin Reports API..." -ForegroundColor Cyan
try {
    $reportsResponse = Invoke-WebRequest -Uri "http://localhost:3000/api/admin/reports/occupancy" -Method GET -Headers @{"Authorization"="Bearer $adminToken"}
    $reportsData = $reportsResponse.Content | ConvertFrom-Json
    Write-Host "✓ Admin Reports API: $($reportsData.success)" -ForegroundColor Green
} catch {
    Write-Host "✗ Admin Reports API Failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Step 16: Test Booking Creation
Write-Host "`n16. Testing Booking Creation..." -ForegroundColor Cyan
try {
    $bookingData = @{
        showId = 1
        seats = @("A1", "A2")
        userDetails = @{
            email = "john@example.com"
            mobile = "+919876543210"
        }
    } | ConvertTo-Json -Depth 3

    $bookingResponse = Invoke-WebRequest -Uri "http://localhost:3000/api/bookings/create" -Method POST -Headers @{"Content-Type"="application/json"; "Authorization"="Bearer $userToken"} -Body $bookingData
    $bookingData = $bookingResponse.Content | ConvertFrom-Json
    Write-Host "✓ Booking Creation: $($bookingData.success)" -ForegroundColor Green
    if ($bookingData.success) {
        $bookingId = $bookingData.bookingId
        Write-Host "  Booking ID: $bookingId" -ForegroundColor Green
    }
} catch {
    Write-Host "✗ Booking Creation Failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Step 17: Test User Bookings API
Write-Host "`n17. Testing User Bookings API..." -ForegroundColor Cyan
try {
    $userBookingsResponse = Invoke-WebRequest -Uri "http://localhost:3000/api/bookings" -Method GET -Headers @{"Authorization"="Bearer $userToken"}
    $userBookingsData = $userBookingsResponse.Content | ConvertFrom-Json
    Write-Host "✓ User Bookings API: $($userBookingsData.success) - Found $($userBookingsData.bookings.Count) bookings" -ForegroundColor Green
} catch {
    Write-Host "✗ User Bookings API Failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Step 18: Test FnB Order (if booking was successful)
Write-Host "`n18. Testing FnB Order..." -ForegroundColor Cyan
try {
    $fnbOrderData = @{
        bookingId = "PVR123456"
        items = @(
            @{itemId = 1; quantity = 2},
            @{itemId = 5; quantity = 2}
        )
    } | ConvertTo-Json -Depth 3

    $fnbOrderResponse = Invoke-WebRequest -Uri "http://localhost:3000/api/fnb/order" -Method POST -Headers @{"Content-Type"="application/json"; "Authorization"="Bearer $userToken"} -Body $fnbOrderData
    $fnbOrderData = $fnbOrderResponse.Content | ConvertFrom-Json
    Write-Host "✓ FnB Order: $($fnbOrderData.success)" -ForegroundColor Green
} catch {
    Write-Host "✗ FnB Order Failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Step 19: Test Payment Initiation
Write-Host "`n19. Testing Payment Initiation..." -ForegroundColor Cyan
try {
    $paymentData = @{
        bookingId = "PVR123456"
        includesFnb = $true
        paymentMethod = "card"
    } | ConvertTo-Json

    $paymentResponse = Invoke-WebRequest -Uri "http://localhost:3000/api/payments/initiate" -Method POST -Headers @{"Content-Type"="application/json"; "Authorization"="Bearer $userToken"} -Body $paymentData
    $paymentData = $paymentResponse.Content | ConvertFrom-Json
    Write-Host "✓ Payment Initiation: $($paymentData.success)" -ForegroundColor Green
} catch {
    Write-Host "✗ Payment Initiation Failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Step 20: Test Payment Confirmation
Write-Host "`n20. Testing Payment Confirmation..." -ForegroundColor Cyan
try {
    $confirmData = @{
        bookingId = "PVR123456"
        status = "success"
        transactionId = "TXN123456789"
    } | ConvertTo-Json

    $confirmResponse = Invoke-WebRequest -Uri "http://localhost:3000/api/payments/confirm" -Method POST -Headers @{"Content-Type"="application/json"; "Authorization"="Bearer $userToken"} -Body $confirmData
    $confirmData = $confirmResponse.Content | ConvertFrom-Json
    Write-Host "✓ Payment Confirmation: $($confirmData.success)" -ForegroundColor Green
} catch {
    Write-Host "✗ Payment Confirmation Failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n=== API Test Complete ===" -ForegroundColor Green
Write-Host "All APIs have been tested. Check the results above." -ForegroundColor Yellow 