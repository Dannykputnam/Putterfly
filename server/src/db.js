import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

// Initialize database connection and export functions
export async function initDb() {

    const db = await open({
      filename: 'database.sqlite',
      driver: sqlite3.Database
    });

    // Enforce foreign key constraints
    await db.exec('PRAGMA foreign_keys = ON;');

    // Initialize database tables
    await setupTables(db);

    return db;
}

export default { initDb };

// Initialize database tables
async function setupTables(db) {
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      isAdmin BOOLEAN DEFAULT 0,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS prints (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      url TEXT,
      quantityAvailable INTEGER NOT NULL DEFAULT 0,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL,
      printId INTEGER NOT NULL,
      quantity INTEGER NOT NULL,
      description TEXT,
      photosLink TEXT,
      status TEXT DEFAULT 'pending',
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      statusUpdatedAt DATETIME,
      FOREIGN KEY (userId) REFERENCES users(id),
      FOREIGN KEY (printId) REFERENCES prints(id)
    );

    CREATE TABLE IF NOT EXISTS app_settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key TEXT UNIQUE NOT NULL,
      value TEXT,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Insert default announcement header if it doesn't exist
    INSERT OR IGNORE INTO app_settings (key, value) 
    VALUES ('announcement_header', 'Please submit your orders by the end of the month!');

    -- Insert default how-to-use text if it doesn't exist
    INSERT OR IGNORE INTO app_settings (key, value) 
    VALUES ('how_to_use', 'Welcome to the Print Catalog App! Browse available prints, specify your requirements, and submit orders easily. Administrators will process your orders and update their status.');
  `);

  // Create triggers for updating timestamps
  await db.exec(`
    CREATE TRIGGER IF NOT EXISTS update_prints_timestamp 
    AFTER UPDATE ON prints
    BEGIN
      UPDATE prints SET updatedAt = CURRENT_TIMESTAMP
      WHERE id = NEW.id;
    END;

    CREATE TRIGGER IF NOT EXISTS update_settings_timestamp
    AFTER UPDATE ON app_settings
    BEGIN
      UPDATE app_settings SET updatedAt = CURRENT_TIMESTAMP
      WHERE id = NEW.id;
    END;
  `);
}
