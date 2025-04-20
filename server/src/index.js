import dotenv from 'dotenv';
dotenv.config();

console.log('ALL ENV:', process.env);

import express from 'express';
import cors from 'cors';
import dbModule, { initDb } from './db.js';
import authRoutes from './routes/auth.js';
import printRoutes from './routes/prints.js';
import orderRoutes from './routes/orders.js';
import userRoutes from './routes/users.js';
import settingsRoutes from './routes/settings.js';

console.log('JWT_SECRET loaded at startup:', `"${process.env.JWT_SECRET}"`, process.env.JWT_SECRET.length);
if (process.env.JWT_SECRET.length !== 16) {
  console.warn('WARNING: JWT_SECRET is not exactly 16 characters long! This will break JWT verification.');
}


const app = express();
const port = process.env.PORT || 5002;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize database and routes
initDb()
  .then(db => {
    // Pass db instance to route handlers
    app.locals.db = db;

    // Routes
    app.use('/api/auth', authRoutes);
    app.use('/api/prints', printRoutes);
    app.use('/api/orders', orderRoutes);
    app.use('/api/users', userRoutes);
    app.use('/api/settings', settingsRoutes);

    // Start server
    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  })
  .catch(err => {
    console.error('Failed to initialize database:', err);
    process.exit(1);
  });
