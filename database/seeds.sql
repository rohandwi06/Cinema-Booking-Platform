-- Expanded seeds for Cinema Booking Platform

-- Cities
INSERT OR IGNORE INTO cities (id, name, state) VALUES
(1, 'Mumbai', 'Maharashtra'),
(2, 'Delhi', 'Delhi'),
(3, 'Bangalore', 'Karnataka'),
(4, 'Chennai', 'Tamil Nadu'),
(5, 'Hyderabad', 'Telangana');

-- Theaters
INSERT OR IGNORE INTO theaters (id, name, address, city_id, facilities, latitude, longitude) VALUES
(1, 'PVR Phoenix Marketcity', 'Kurla West, Mumbai', 1, '["Parking", "Food Court"]', 19.0860, 72.8886),
(2, 'INOX Nehru Place', 'Nehru Place, Delhi', 2, '["Parking"]', 28.55, 77.25),
(3, 'Cinepolis Orion', 'Malleshwaram, Bangalore', 3, '["Food Court"]', 13.01, 77.56),
(4, 'Sathyam Cinemas', 'Royapettah, Chennai', 4, '["Parking", "Food Court"]', 13.06, 80.27),
(5, 'Prasads IMAX', 'NTR Gardens, Hyderabad', 5, '["Parking", "IMAX"]', 17.41, 78.47);

-- Screens
INSERT OR IGNORE INTO screens (id, theater_id, name, type, capacity, sound_system) VALUES
(1, 1, 'Screen 1', 'IMAX', 200, 'Dolby Atmos'),
(2, 1, 'Screen 2', '2D', 150, 'Dolby Digital'),
(3, 2, 'Screen 1', '2D', 180, 'Dolby Digital'),
(4, 3, 'Screen 1', '3D', 120, 'Dolby Digital'),
(5, 4, 'Screen 1', '2D', 100, 'Dolby Digital'),
(6, 5, 'Screen 1', 'IMAX', 300, 'Dolby Atmos');

-- Seat Layouts (JSON) for each screen (used by backend)
INSERT OR IGNORE INTO seat_layouts (screen_id, layout_data) VALUES
(1, '{"regular":{"rows":["A"],"seatsPerRow":3},"premium":{"rows":["B"],"seatsPerRow":2},"recliner":{"rows":["C"],"seatsPerRow":2}}'),
(2, '{"regular":{"rows":["A"],"seatsPerRow":2},"premium":{"rows":["B"],"seatsPerRow":1},"recliner":{"rows":["C"],"seatsPerRow":1}}'),
(3, '{"regular":{"rows":["A"],"seatsPerRow":2},"premium":{"rows":["B"],"seatsPerRow":1},"recliner":{"rows":["C"],"seatsPerRow":1}}'),
(4, '{"regular":{"rows":["A"],"seatsPerRow":2},"premium":{"rows":["B"],"seatsPerRow":1},"recliner":{"rows":["C"],"seatsPerRow":1}}'),
(5, '{"regular":{"rows":["A"],"seatsPerRow":2},"premium":{"rows":["B"],"seatsPerRow":1},"recliner":{"rows":["C"],"seatsPerRow":1}}'),
(6, '{"regular":{"rows":["A"],"seatsPerRow":2},"premium":{"rows":["B"],"seatsPerRow":1},"recliner":{"rows":["C"],"seatsPerRow":1}}');

-- Seat Layout for each screen (A: regular, B: premium, C: recliner)
INSERT OR IGNORE INTO seat_layout (screen_id, category, row, seat_number, is_blocked) VALUES
-- Screen 1
(1, 'regular', 'A', 1, 0), (1, 'regular', 'A', 2, 0), (1, 'regular', 'A', 3, 0),
(1, 'premium', 'B', 1, 0), (1, 'premium', 'B', 2, 0),
(1, 'recliner', 'C', 1, 0), (1, 'recliner', 'C', 2, 0),
-- Screen 2
(2, 'regular', 'A', 1, 0), (2, 'regular', 'A', 2, 0),
(2, 'premium', 'B', 1, 0),
(2, 'recliner', 'C', 1, 0),
-- Screen 3
(3, 'regular', 'A', 1, 0), (3, 'regular', 'A', 2, 0),
(3, 'premium', 'B', 1, 0),
(3, 'recliner', 'C', 1, 0),
-- Screen 4
(4, 'regular', 'A', 1, 0), (4, 'regular', 'A', 2, 0),
(4, 'premium', 'B', 1, 0),
(4, 'recliner', 'C', 1, 0),
-- Screen 5
(5, 'regular', 'A', 1, 0), (5, 'regular', 'A', 2, 0),
(5, 'premium', 'B', 1, 0),
(5, 'recliner', 'C', 1, 0),
-- Screen 6
(6, 'regular', 'A', 1, 0), (6, 'regular', 'A', 2, 0),
(6, 'premium', 'B', 1, 0),
(6, 'recliner', 'C', 1, 0);

-- Movies (10+)
INSERT OR IGNORE INTO movies (id, title, description, duration_mins, genre, language, format, release_date, rating, cast, director, producer, poster_url, trailer_url, imdb_rating, is_upcoming) VALUES
(1, 'Avengers: Endgame', 'The Avengers assemble...', 180, '["Action"]', '["English"]', '["IMAX"]', '2019-04-26', 'UA', '[{"name":"Robert Downey Jr.","role":"Iron Man"}]', 'Russo Brothers', 'Kevin Feige', 'url', 'url', 8.4, 0),
(2, 'Deadpool & Wolverine', 'Deadpool joins Wolverine...', 150, '["Action","Comedy"]', '["English"]', '["IMAX"]', '2025-07-26', 'UA', '[{"name":"Ryan Reynolds","role":"Deadpool"}]', 'Shawn Levy', 'Kevin Feige', 'url', 'url', 0, 1),
(3, 'Inception', 'A thief who steals dreams...', 148, '["Sci-Fi"]', '["English"]', '["IMAX"]', '2010-07-16', 'UA', '[{"name":"Leonardo DiCaprio","role":"Cobb"}]', 'Christopher Nolan', 'Emma Thomas', 'url', 'url', 8.8, 0),
(4, 'Jawan', 'A man is driven by a personal vendetta...', 170, '["Action"]', '["Hindi"]', '["2D"]', '2023-09-07', 'UA', '[{"name":"Shah Rukh Khan","role":"Vikram"}]', 'Atlee', 'Gauri Khan', 'url', 'url', 7.5, 0),
(5, 'Pushpa 2', 'The Rule continues...', 160, '["Action"]', '["Telugu"]', '["2D"]', '2025-01-15', 'UA', '[{"name":"Allu Arjun","role":"Pushpa"}]', 'Sukumar', 'Mythri Movie Makers', 'url', 'url', 0, 1),
(6, 'Barbie', 'Barbie and Ken...', 120, '["Comedy"]', '["English"]', '["2D"]', '2023-07-21', 'UA', '[{"name":"Margot Robbie","role":"Barbie"}]', 'Greta Gerwig', 'David Heyman', 'url', 'url', 7.2, 0),
(7, 'Oppenheimer', 'The story of J. Robert Oppenheimer...', 180, '["Drama"]', '["English"]', '["IMAX"]', '2023-07-21', 'UA', '[{"name":"Cillian Murphy","role":"Oppenheimer"}]', 'Christopher Nolan', 'Emma Thomas', 'url', 'url', 8.6, 0),
(8, 'Leo', 'A mild-mannered cafe owner...', 160, '["Action"]', '["Tamil"]', '["2D"]', '2023-10-19', 'UA', '[{"name":"Vijay","role":"Leo"}]', 'Lokesh Kanagaraj', 'Seven Screen Studio', 'url', 'url', 7.8, 0),
(9, 'Salaar', 'A gang leader tries to keep a promise...', 155, '["Action"]', '["Telugu"]', '["2D"]', '2023-12-22', 'UA', '[{"name":"Prabhas","role":"Salaar"}]', 'Prashanth Neel', 'Hombale Films', 'url', 'url', 0, 1),
(10, 'Dunki', 'A story of illegal immigration...', 140, '["Comedy"]', '["Hindi"]', '["2D"]', '2023-12-22', 'UA', '[{"name":"Shah Rukh Khan","role":"Hardy"}]', 'Rajkumar Hirani', 'Red Chillies', 'url', 'url', 0, 1);

-- Shows (future dates, multiple per movie)
INSERT OR IGNORE INTO shows (id, movie_id, screen_id, theater_id, show_date, show_time, base_price, format, language, status) VALUES
(1, 1, 1, 1, '2030-01-01', '10:30', 200.00, 'IMAX', 'English', 'active'),
(2, 2, 2, 1, '2030-01-01', '21:00', 300.00, 'IMAX', 'English', 'active'),
(3, 3, 3, 2, '2030-01-02', '17:00', 250.00, '2D', 'English', 'active'),
(4, 4, 4, 3, '2030-01-03', '20:00', 200.00, '2D', 'Hindi', 'active'),
(5, 5, 5, 4, '2030-01-04', '19:00', 220.00, '2D', 'Telugu', 'active'),
(6, 6, 6, 5, '2030-01-05', '16:00', 400.00, 'IMAX', 'English', 'active'),
(7, 7, 1, 1, '2030-01-06', '18:00', 350.00, 'IMAX', 'English', 'active'),
(8, 8, 2, 1, '2030-01-07', '21:00', 300.00, '2D', 'Tamil', 'active'),
(9, 9, 3, 2, '2030-01-08', '17:00', 250.00, '2D', 'Telugu', 'active'),
(10, 10, 4, 3, '2030-01-09', '20:00', 200.00, '2D', 'Hindi', 'active');

-- Seat Pricing for each show
INSERT OR IGNORE INTO seat_pricing (show_id, category, price) VALUES
(1, 'regular', 200), (1, 'premium', 300), (1, 'recliner', 500),
(2, 'regular', 180), (2, 'premium', 250), (2, 'recliner', 400),
(3, 'regular', 150), (3, 'premium', 200), (3, 'recliner', 350),
(4, 'regular', 120), (4, 'premium', 180), (4, 'recliner', 300),
(5, 'regular', 100), (5, 'premium', 150), (5, 'recliner', 250),
(6, 'regular', 250), (6, 'premium', 350), (6, 'recliner', 600),
(7, 'regular', 220), (7, 'premium', 320), (7, 'recliner', 520),
(8, 'regular', 180), (8, 'premium', 250), (8, 'recliner', 400),
(9, 'regular', 150), (9, 'premium', 200), (9, 'recliner', 350),
(10, 'regular', 120), (10, 'premium', 180), (10, 'recliner', 300);

-- Users (bcrypt hashes for password: "adminpassword" and "johnpassword")
INSERT OR IGNORE INTO users (id, name, email, password, mobile, date_of_birth, is_admin) VALUES
(1, 'Admin User', 'admin@example.com', '$2b$10$kJZYuy1sFGmI98VD.7ofFemdgb5pApPShAylj9tKxjwie7qn7n5.G', '+919999999999', '1985-05-15', 1),
(2, 'John Doe', 'john@example.com', '$2b$10$BTnWO7gJpqpszF39raPOju9yETMacxopR5WyZSjTY6pWeV/hNpXEG', '+919876543210', '1990-01-01', 0);

-- ... existing code ...
INSERT OR IGNORE INTO snacks (id, name, description, category, price, size, is_veg) VALUES
(1, 'Popcorn', 'Freshly popped popcorn', 'Snacks', 200.00, 'Medium', 1),
(2, 'Coke', 'Chilled Coca Cola', 'Beverages', 120.00, 'Regular', 1),
(3, 'Nachos', 'Crispy nachos with cheese dip', 'Snacks', 180.00, 'Regular', 1),
(4, 'Samosa', 'Spicy potato samosa', 'Snacks', 60.00, 'Single', 1),
(5, 'Water Bottle', 'Mineral water', 'Beverages', 50.00, '500ml', 1),
-- Combos
(6, 'Popcorn + Coke Combo', 'Medium Popcorn + Regular Coke', 'Combo', 290.00, 'Combo', 1),
(7, 'Nachos + Coke Combo', 'Nachos + Regular Coke', 'Combo', 270.00, 'Combo', 1),
(8, 'Samosa + Coke Combo', '2 Samosas + Regular Coke', 'Combo', 180.00, 'Combo', 1); 

-- ... existing code ...