import express from 'express';

import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get user count (admin only)
router.get('/count', authenticateToken, async (req, res) => {
  const db = req.app.locals.db;
  if (!req.user.isAdmin) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  
  try {
    const result = await db.get('SELECT COUNT(*) as count FROM users WHERE isAdmin = 0');
    res.json({ count: result.count });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user profile
router.get('/profile', authenticateToken, async (req, res) => {
  const db = req.app.locals.db;
  try {
    const user = await db.get('SELECT id, email, name, isAdmin FROM users WHERE id = ?', [req.user.id]);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update user profile
router.put('/profile', authenticateToken, async (req, res) => {
  const db = req.app.locals.db;
  const { name, email } = req.body;
  try {
    // Check if email is already taken by another user
    if (email) {
      const existingUser = await db.get('SELECT id FROM users WHERE email = ? AND id != ?', [email, req.user.id]);
      if (existingUser) {
        return res.status(400).json({ error: 'Email already in use' });
      }
    }

    await db.run(
      'UPDATE users SET name = ?, email = ? WHERE id = ?',
      [name, email, req.user.id]
    );
    res.json({ message: 'Profile updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
