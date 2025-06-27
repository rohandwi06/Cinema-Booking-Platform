// src/config/database.js

const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt'); // Import bcrypt for password hashing

const DB_PATH = process.env.DB_PATH || './database/cinema.db';
const SCHEMA_PATH = path.join(__dirname, '../../database/schema.sql');
const SEEDS_PATH = path.join(__dirname, '../../database/seeds.sql');

let db;

async function initializeDatabase() {
    try {
        console.log(`[DB] Attempting to connect to SQLite database: ${DB_PATH}`);
        db = await open({
            filename: DB_PATH,
            driver: sqlite3.Database
        });
        console.log(`[DB] Successfully connected to SQLite database: ${DB_PATH}`);

        // --- MODIFICATION START ---
        // For development, always apply schema and seeds to ensure a clean, up-to-date database.
        // The DROP TABLE IF EXISTS in schema.sql handles existing tables gracefully.
        console.log('[DB] Applying schema and seeds (forcing a fresh database in dev mode)...');
        await applySchema();
        await applySeeds();
        console.log('[DB] Database schema and seed data applied successfully.');
        // --- MODIFICATION END ---

        return db;
    } catch (error) {
        console.error('[DB ERROR] Error connecting to or initializing database:', error);
        process.exit(1); // Exit process if database connection fails
    }
}

async function applySchema() {
    console.log('[DB] Reading schema file...');
    const schema = fs.readFileSync(SCHEMA_PATH, 'utf-8');
    console.log('[DB] Executing schema...');
    await db.exec(schema);
    console.log('[DB] Schema applied.');
}

async function applySeeds() {
    console.log('[DB] Hashing seed passwords...');
    // Hash passwords before inserting seed data
    const userHashedPassword = await bcrypt.hash('securePassword123', 10);
    const adminHashedPassword = await bcrypt.hash('adminpassword', 10);
    console.log('[DB] Passwords hashed.');

    console.log('[DB] Reading seeds file...');
    let seeds = fs.readFileSync(SEEDS_PATH, 'utf-8');

    // Replace placeholder password hashes with actual hashed passwords
    seeds = seeds.replace(/userpassword_hash_placeholder/g, userHashedPassword);
    seeds = seeds.replace(/adminpassword_hash_placeholder/g, adminHashedPassword);

    console.log('[DB] Executing seed data...');
    await db.exec(seeds);
    console.log('[DB] Seed data applied.');
}


function getDatabase() {
    if (!db) {
        console.error('[DB ERROR] Database not initialized when getDatabase() was called!');
        throw new Error('Database not initialized. Call initializeDatabase() first.');
    }
    return db;
}

module.exports = {
    initializeDatabase,
    getDatabase
};
