# Cinema Booking Platform API

A comprehensive Node.js/Express API for a cinema booking platform with JWT authentication, movie management, show scheduling, seat booking, and payment processing.

## Features

- **Authentication**: JWT-based user and admin authentication
- **Movie Management**: CRUD operations for movies (admin only)
- **Show Management**: Create, update, delete shows (admin only)
- **Seat Booking**: Real-time seat availability and booking
- **Payment Processing**: Integrated payment gateway
- **Food & Beverage**: FnB ordering system
- **Admin Dashboard**: Revenue reports and booking management

## Fixed Issues

✅ **Movie Management**: Added create, update, delete functionality  
✅ **Show Management**: Implemented create, update, delete operations  
✅ **JWT Authentication**: Proper token generation and validation  
✅ **Admin Authorization**: Role-based access control  
✅ **Postman Collection**: Updated with automatic token handling  

## Quick Start

### Prerequisites

- Node.js (v14 or higher)
- SQLite3
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd cinemaBookingPlatform
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
# Create .env file
JWT_SECRET=your_jwt_secret_key_here
PORT=3000
```

4. Initialize the database:
```bash
npm run init-db
```

5. Start the server:
```bash
npm start
```

The API will be available at `http://localhost:3000`

## API Endpoints

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register a new user |
| POST | `/api/auth/login` | Login user/admin |

### Movies

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/movies` | Get movies with filters | No |
| GET | `/api/movies/:id` | Get movie details | No |
| GET | `/api/movies/upcoming` | Get upcoming movies | No |
| POST | `/api/movies` | Create new movie | Admin |
| PUT | `/api/movies/:id` | Update movie | Admin |
| DELETE | `/api/movies/:id` | Delete movie | Admin |

### Shows

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/shows` | Get shows with filters | No |
| GET | `/api/shows/:showId` | Get show details | No |
| GET | `/api/shows/movie/:movieId` | Get shows by movie | No |
| POST | `/api/shows` | Create new show | Admin |
| PUT | `/api/shows/:showId` | Update show | Admin |
| DELETE | `/api/shows/:showId` | Delete show | Admin |

### Bookings

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/bookings` | Create booking | User |
| GET | `/api/bookings/:bookingId` | Get booking details | User |

### Seats

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/shows/:showId/seats` | Get seat layout | No |
| POST | `/api/shows/:showId/seats/block` | Block seats | User |

## Testing with Postman

### Import Collection

1. Import the `cinemaBookingPlatform.postman_collection.json` file into Postman
2. Set up environment variables:
   - `base_url`: `http://localhost:3000`
   - `user_token`: (will be auto-populated after login)
   - `admin_token`: (will be auto-populated after admin login)

### Testing Flow

1. **Register/Login**: Start with user registration or login
2. **Admin Login**: Login as admin for management operations
3. **Create Movie**: Use admin token to create a new movie
4. **Create Show**: Schedule shows for the movie
5. **Test Booking**: Create bookings as a regular user

### Automatic Token Handling

The Postman collection includes pre-request scripts that automatically:
- Set the `Authorization` header with the appropriate token
- Use `admin_token` for admin endpoints
- Use `user_token` for user endpoints

## Example Requests

### Create Movie (Admin)
```bash
POST /api/movies
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "title": "The Matrix Resurrections",
  "description": "Return to the world of The Matrix...",
  "duration_mins": 148,
  "genre": ["Action", "Sci-Fi", "Thriller"],
  "language": ["English"],
  "format": ["2D", "3D", "IMAX"],
  "release_date": "2021-12-22",
  "rating": "R",
  "cast": ["Keanu Reeves", "Carrie-Anne Moss"],
  "director": "Lana Wachowski",
  "producer": "James McTeigue",
  "poster_url": "https://example.com/poster.jpg",
  "trailer_url": "https://example.com/trailer.mp4",
  "imdb_rating": 7.2,
  "is_upcoming": false
}
```

### Create Show (Admin)
```bash
POST /api/shows
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "movieId": 1,
  "screenId": 1,
  "theaterId": 1,
  "showDate": "2024-01-20",
  "showTime": "14:30",
  "basePrice": 250,
  "format": "2D",
  "language": "English"
}
```

### Update Show (Admin)
```bash
PUT /api/shows/1
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "showTime": "15:00",
  "basePrice": 300
}
```

## Testing Script

Run the PowerShell test script to verify all endpoints:

```powershell
.\test_apis.ps1
```

This script will:
- Test user registration and login
- Test admin login
- Test movie creation, update, and retrieval
- Test show creation, update, and retrieval
- Provide detailed feedback on each endpoint

## Database Schema

The application uses SQLite with the following main tables:
- `users` - User accounts and authentication
- `movies` - Movie information and metadata
- `shows` - Show scheduling and pricing
- `theaters` - Theater and screen information
- `bookings` - Booking records and status
- `booked_seats` - Individual seat bookings
- `seat_pricing` - Dynamic pricing for different seat categories

## Error Handling

The API includes comprehensive error handling:
- Input validation using Joi schemas
- Database constraint validation
- JWT token validation and expiration handling
- Role-based access control
- Centralized error responses

## Security Features

- JWT token-based authentication
- Password hashing with bcrypt
- Role-based authorization (User/Admin)
- Input validation and sanitization
- Rate limiting on API endpoints
- CORS configuration

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Backend Seat Pricing Behavior

- When an admin creates a new show, seat pricing is automatically inserted for **all seat categories** present in the seat layout for the screen.
- If the seat layout is missing or invalid for the screen, show creation will fail with a clear error.
- When updating a show's base price, all seat pricing rows for that show are updated for all categories.
- This ensures bookings never fail due to missing seat pricing for any category.

## (Optional) Reset/Demo Script

- If you want to reset the database and seed demo data for easy testing, use the provided script (see scripts/ or ask the maintainer).
#
