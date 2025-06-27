-- Drop tables if they exist to ensure a clean slate during development

PRAGMA foreign_keys = OFF;
DROP TABLE IF EXISTS food_orders;
DROP TABLE IF EXISTS payments;
DROP TABLE IF EXISTS booked_seats;
DROP TABLE IF EXISTS bookings;
DROP TABLE IF EXISTS seat_layouts;
DROP TABLE IF EXISTS shows;
DROP TABLE IF EXISTS screens;
DROP TABLE IF EXISTS theaters;
DROP TABLE IF EXISTS movies;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS cities;
DROP TABLE IF EXISTS snacks;
DROP TABLE IF EXISTS seat_layout;
DROP TABLE IF EXISTS seat_pricing;

-- Users Table
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  mobile TEXT NOT NULL UNIQUE,
  date_of_birth DATE NOT NULL,
  is_admin INTEGER NOT NULL DEFAULT 0
);

-- Cities Table
CREATE TABLE IF NOT EXISTS cities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    state TEXT NOT NULL
);

-- Theaters Table
CREATE TABLE IF NOT EXISTS theaters (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    city_id INTEGER NOT NULL,
    facilities TEXT,
    latitude REAL,
    longitude REAL,
    FOREIGN KEY (city_id) REFERENCES cities(id)
);

-- Screens Table
CREATE TABLE IF NOT EXISTS screens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    theater_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    capacity INTEGER NOT NULL,
    sound_system TEXT,
    FOREIGN KEY (theater_id) REFERENCES theaters(id)
);

-- Movies Table
CREATE TABLE IF NOT EXISTS movies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    duration_mins INTEGER NOT NULL,
    genre TEXT,
    language TEXT,
    format TEXT,
    release_date TEXT NOT NULL,
    rating TEXT,
    cast TEXT,
    director TEXT,
    producer TEXT,
    poster_url TEXT,
    trailer_url TEXT,
    imdb_rating REAL,
    is_upcoming INTEGER DEFAULT 0
);

-- Shows Table
CREATE TABLE IF NOT EXISTS shows (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    movie_id INTEGER NOT NULL,
    screen_id INTEGER NOT NULL,
    theater_id INTEGER NOT NULL,
    show_date TEXT NOT NULL,
    show_time TEXT NOT NULL,
    base_price REAL NOT NULL,
    format TEXT NOT NULL,
    language TEXT NOT NULL,
    status TEXT DEFAULT 'active',
    FOREIGN KEY (movie_id) REFERENCES movies(id),
    FOREIGN KEY (screen_id) REFERENCES screens(id),
    FOREIGN KEY (theater_id) REFERENCES theaters(id)
);

-- Seat Layouts Table
CREATE TABLE IF NOT EXISTS seat_layouts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    screen_id INTEGER UNIQUE NOT NULL,
    layout_data TEXT NOT NULL,
    FOREIGN KEY (screen_id) REFERENCES screens(id)
);

-- Bookings Table
CREATE TABLE IF NOT EXISTS bookings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    show_id INTEGER NOT NULL,
    booking_reference TEXT UNIQUE NOT NULL,
    total_amount REAL NOT NULL,
    booking_status TEXT NOT NULL DEFAULT 'pending',
    payment_status TEXT NOT NULL DEFAULT 'pending',
    booked_at TEXT DEFAULT CURRENT_TIMESTAMP,
    user_email TEXT NOT NULL,
    user_mobile TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (show_id) REFERENCES shows(id)
);

-- Booked Seats Table (Fixed Version with all required columns)
CREATE TABLE IF NOT EXISTS booked_seats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    show_id INTEGER NOT NULL,
    seat_label TEXT NOT NULL,
    seat_category TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'confirmed',
    held_until TEXT,
    booking_id INTEGER,
    FOREIGN KEY(user_id) REFERENCES users(id),
    FOREIGN KEY(show_id) REFERENCES shows(id),
    FOREIGN KEY(booking_id) REFERENCES bookings(id),
    UNIQUE (show_id, seat_label)
);

-- Payments Table
CREATE TABLE IF NOT EXISTS payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    booking_id INTEGER NOT NULL,
    transaction_id TEXT UNIQUE NOT NULL,
    amount REAL NOT NULL,
    method TEXT NOT NULL,
    status TEXT NOT NULL,
    payment_date TEXT DEFAULT CURRENT_TIMESTAMP,
    breakdown TEXT,
    FOREIGN KEY (booking_id) REFERENCES bookings(id)
);

-- Snacks Table
CREATE TABLE IF NOT EXISTS snacks (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  price REAL,
  size TEXT,
  is_veg BOOLEAN DEFAULT 1
);

-- Food Orders Table
CREATE TABLE IF NOT EXISTS food_orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    booking_id INTEGER NOT NULL,
    snack_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    price_at_order REAL NOT NULL,
    ordered_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings(id),
    FOREIGN KEY (snack_id) REFERENCES snacks(id)
);

-- Static Seat Layout Table
CREATE TABLE IF NOT EXISTS seat_layout (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  screen_id INTEGER NOT NULL,
  category TEXT NOT NULL,
  row TEXT NOT NULL,
  seat_number INTEGER NOT NULL,
  is_blocked INTEGER DEFAULT 0,
  FOREIGN KEY (screen_id) REFERENCES screens(id)
);

-- Seat Pricing Table
CREATE TABLE IF NOT EXISTS seat_pricing (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  show_id INTEGER NOT NULL,
  category TEXT NOT NULL,
  price INTEGER NOT NULL,
  FOREIGN KEY (show_id) REFERENCES shows(id)
);

PRAGMA foreign_keys = ON;

