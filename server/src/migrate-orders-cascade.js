// Migration script to add ON DELETE CASCADE to orders table foreign keys in SQLite
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

async function migrate() {
  const db = await open({ filename: 'database.sqlite', driver: sqlite3.Database });

  // 1. Rename old table
  await db.exec('ALTER TABLE orders RENAME TO orders_old;');

  // 2. Create new table with ON DELETE CASCADE
  await db.exec(`
    CREATE TABLE orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL,
      printId INTEGER NOT NULL,
      quantity INTEGER NOT NULL,
      description TEXT,
      photosLink TEXT,
      status TEXT DEFAULT 'pending',
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      statusUpdatedAt DATETIME,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (printId) REFERENCES prints(id) ON DELETE CASCADE
    );
  `);

  // 3. Copy data
  await db.exec(`
    INSERT INTO orders (id, userId, printId, quantity, description, photosLink, status, createdAt, statusUpdatedAt)
    SELECT id, userId, printId, quantity, description, photosLink, status, createdAt, statusUpdatedAt FROM orders_old;
  `);

  // 4. Drop old table
  await db.exec('DROP TABLE orders_old;');

  console.log('Migration complete: orders table now has ON DELETE CASCADE.');
  await db.close();
}

migrate().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
