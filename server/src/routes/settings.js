import express from 'express';

import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get app settings
router.get('/', async (req, res) => {
  const db = req.app.locals.db;
  try {
    const settings = await db.all('SELECT key, value FROM app_settings');
    const settingsObject = settings.reduce((acc, setting) => {
      acc[setting.key] = setting.value;
      return acc;
    }, {});
    res.json(settingsObject);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update announcement header (admin only)
router.put('/announcement', authenticateToken, async (req, res) => {
  const db = req.app.locals.db;
  if (!req.user.isAdmin) {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const { header } = req.body;
  if (!header) {
    return res.status(400).json({ error: 'Header is required' });
  }

  try {
    await db.run(
      'UPDATE app_settings SET value = ? WHERE key = ?',
      [header, 'announcement_header']
    );
    res.json({ message: 'Announcement header updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update how-to-use text (admin only)
router.put('/how-to-use', authenticateToken, async (req, res) => {
  const db = req.app.locals.db;
  if (!req.user.isAdmin) {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const { text } = req.body;
  if (!text) {
    return res.status(400).json({ error: 'Text is required' });
  }

  try {
    await db.run(
      'UPDATE app_settings SET value = ? WHERE key = ?',
      [text, 'how_to_use']
    );
    res.json({ message: 'How-to-use text updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
