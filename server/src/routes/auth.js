// This file will handle user authentication (register, login, profile update)
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
const router = express.Router();
if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET is not defined. Check your .env file and dotenv config.');
}
const JWT_SECRET = process.env.JWT_SECRET.trim();


// Register
router.post('/register', async (req, res) => {
  const db = req.app.locals.db;
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required' });
  }
  try {
    const existing = await db.get('SELECT * FROM users WHERE email = ?', [email]);
    if (existing) {
      return res.status(409).json({ error: 'Email already in use' });
    }
    const hash = await bcrypt.hash(password, 10);
    const result = await db.run('INSERT INTO users (name, email, password, isAdmin) VALUES (?, ?, ?, ?)', [name, email, hash, 0]);
    const user = await db.get('SELECT id, name, email, isAdmin FROM users WHERE id = ?', [result.lastID]);
    console.log('JWT_SECRET value and length:', `"${JWT_SECRET}"`, JWT_SECRET.length);
console.log('Type of JWT_SECRET:', typeof JWT_SECRET);
const token = jwt.sign({ id: user.id, name: user.name, email: user.email, isAdmin: user.isAdmin }, JWT_SECRET, { expiresIn: '1d' });
console.log('Token created:', token);
    res.json({ token });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  const db = req.app.locals.db;
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }
  try {
    const user = await db.get('SELECT * FROM users WHERE email = ?', [email]);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    console.log('JWT_SECRET value and length:', `"${JWT_SECRET}"`, JWT_SECRET.length);
console.log('Type of JWT_SECRET:', typeof JWT_SECRET);
const token = jwt.sign({ id: user.id, name: user.name, email: user.email, isAdmin: user.isAdmin }, JWT_SECRET, { expiresIn: '1d' });
console.log('Token created:', token);
    res.json({ token });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Profile update (name/password)
router.put('/profile', async (req, res) => {
  const db = req.app.locals.db;
  const { id, name, password } = req.body;
  if (!id) return res.status(400).json({ error: 'User ID required' });
  let update = 'UPDATE users SET ';
  const params = [];
  if (name) {
    update += 'name = ?';
    params.push(name);
  }
  if (password) {
    if (params.length) update += ', ';
    update += 'password = ?';
    params.push(await bcrypt.hash(password, 10));
  }
  update += ' WHERE id = ?';
  params.push(id);
  await db.run(update, ...params);
  res.json({ success: true });
});

export default router;
