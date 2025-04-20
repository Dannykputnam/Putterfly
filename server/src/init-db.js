import { initDb } from './db.js';

// Run this script once to initialize the database tables
initDb().then(() => {
  console.log('Database initialized.');
  process.exit(0);
}).catch((err) => {
  console.error('DB init error:', err);
  process.exit(1);
});
