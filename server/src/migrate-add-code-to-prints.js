import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

async function migrate() {
  const db = await open({
    filename: './database.sqlite', // Updated path to match your actual DB file
    driver: sqlite3.Database
  });
  try {
    // Add the 'code' column if it doesn't already exist
    await db.run("ALTER TABLE prints ADD COLUMN code TEXT");
    console.log("Migration complete: 'code' column added to prints table.");
  } catch (err) {
    if (err.message.includes('duplicate column name')) {
      console.log("Column 'code' already exists. No changes made.");
    } else {
      console.error('Migration error:', err);
    }
  } finally {
    await db.close();
  }
}

migrate();
