import express from 'express';
import multer from 'multer';
import xlsx from 'xlsx';

import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Get all prints
router.get('/', async (req, res) => {
  const db = req.app.locals.db;
  try {
    const prints = await db.all('SELECT * FROM prints');
    res.json(prints.map(print => ({
      ...print,
      isAvailable: print.quantityAvailable > 0,
      code: print.code || null
    })));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Search prints
router.get('/search', async (req, res) => {
  const db = req.app.locals.db;
  const { query } = req.query;
  try {
    const prints = await db.all(
      'SELECT * FROM prints WHERE name LIKE ?',
      [`%${query}%`]
    );
    res.json(prints.map(print => ({
      ...print,
      isAvailable: print.quantityAvailable > 0,
      code: print.code || null
    })));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Upload prints from Excel (admin only)
router.post('/upload', authenticateToken, upload.single('file'), async (req, res) => {
  console.log('UPLOAD ROUTE HIT');
  const db = req.app.locals.db;
  if (!req.user.isAdmin) {
    return res.status(403).json({ error: 'Admin access required' });
  }

  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const workbook = xlsx.read(req.file.buffer);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const prints = xlsx.utils.sheet_to_json(sheet);
    console.log('Parsed prints from Excel:', prints);

    // Validate required fields
    for (const print of prints) {
      if (!print.name || typeof print.quantityAvailable !== 'number') {
        return res.status(400).json({
          error: 'Excel file must contain name and quantityAvailable columns'
        });
      }
    }

    // Begin transaction
    await db.run('BEGIN TRANSACTION');

    // Clear existing prints
    await db.run('DELETE FROM prints');

    // Insert new prints
    for (const print of prints) {
      console.log('Uploading print:', print);
      await db.run(
        'INSERT INTO prints (name, url, quantityAvailable, code) VALUES (?, ?, ?, ?)',
        [print.name, print.url || null, print.quantityAvailable, print.code || null]
      );
    }

    // Commit transaction
    await db.run('COMMIT');
    res.json({ message: 'Prints uploaded successfully', count: prints.length });
  } catch (error) {
    // Rollback on error
    await db.run('ROLLBACK');
    res.status(500).json({ error: error.message });
  }
});

// Add a new print manually (admin only)
router.post('/', authenticateToken, async (req, res) => {
  const db = req.app.locals.db;
  if (!req.user.isAdmin) {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const { name, url, quantityAvailable } = req.body;
  try {
    const result = await db.run(
      'INSERT INTO prints (name, url, quantityAvailable) VALUES (?, ?, ?)',
      [name, url, quantityAvailable]
    );
    res.status(201).json({ id: result.lastID });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update a print (admin only)
router.put('/:id', authenticateToken, async (req, res) => {
  const db = req.app.locals.db;
  if (!req.user.isAdmin) {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const { name, url, quantityAvailable } = req.body;
  try {
    await db.run(
      'UPDATE prints SET name = ?, url = ?, quantityAvailable = ? WHERE id = ?',
      [name, url, quantityAvailable, req.params.id]
    );
    res.json({ message: 'Print updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete all prints (admin only)
router.delete('/all', authenticateToken, async (req, res) => {
  const db = req.app.locals.db;
  if (!req.user.isAdmin) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  try {
    const { changes } = await db.run('DELETE FROM prints');
    res.json({ message: 'All prints deleted', deleted: changes });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete a print (admin only)
router.delete('/:id', authenticateToken, async (req, res) => {
  const db = req.app.locals.db;
  if (!req.user.isAdmin) {
    return res.status(403).json({ error: 'Admin access required' });
  }

  try {
    // Check if there are any orders for this print
    const orders = await db.get('SELECT COUNT(*) as count FROM orders WHERE printId = ?', [req.params.id]);
    if (orders.count > 0) {
      return res.status(400).json({ error: 'Cannot delete print with existing orders' });
    }

    await db.run('DELETE FROM prints WHERE id = ?', [req.params.id]);
    res.json({ message: 'Print deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete all prints (admin only)
router.delete('/all', authenticateToken, async (req, res) => {
  const db = req.app.locals.db;
  if (!req.user.isAdmin) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  try {
    const { changes } = await db.run('DELETE FROM prints');
    res.json({ message: 'All prints deleted', deleted: changes });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
