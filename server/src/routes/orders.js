import express from 'express';

import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get all orders (admin only)
router.get('/all', authenticateToken, async (req, res) => {
  const db = req.app.locals.db;
  if (!req.user.isAdmin) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  
  try {
    const orders = await db.all(`
      SELECT orders.*, users.name as userName, prints.name as printName 
      FROM orders 
      JOIN users ON orders.userId = users.id
      JOIN prints ON orders.printId = prints.id
      ORDER BY orders.status ASC, orders.createdAt DESC
    `);
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user's orders
router.get('/', authenticateToken, async (req, res) => {
  const db = req.app.locals.db;
  try {
    const orders = await db.all(`
      SELECT orders.*, prints.name as printName, prints.code as printCode 
      FROM orders 
      JOIN prints ON orders.printId = prints.id
      WHERE orders.userId = ?
      ORDER BY orders.status ASC, orders.createdAt DESC
    `, [req.user.id]);
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new order
router.post('/', authenticateToken, async (req, res) => {
  const db = req.app.locals.db;
  const { printId, quantity, description, photosLink } = req.body;

  if (!quantity || quantity <= 0) {
    return res.status(400).json({ error: 'Invalid quantity' });
  }

  try {
    // Begin transaction
    await db.run('BEGIN TRANSACTION');

    // Check print availability and quantity
    const print = await db.get('SELECT quantityAvailable, code FROM prints WHERE id = ?', [printId]);
    if (!print) {
      await db.run('ROLLBACK');
      return res.status(404).json({ error: 'Print not found' });
    }
    if (print.quantityAvailable < quantity) {
      await db.run('ROLLBACK');
      return res.status(400).json({ error: 'Not enough quantity available' });
    }

    // Set status to 'ordered' if print has a code, otherwise 'pending'
    const orderStatus = print.code ? 'ordered' : 'pending';

    // Create order
    const result = await db.run(
      'INSERT INTO orders (userId, printId, quantity, description, photosLink, status, createdAt) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)',
      [req.user.id, printId, quantity, description, photosLink, orderStatus]
    );

    // Update print quantity
    await db.run(
      'UPDATE prints SET quantityAvailable = quantityAvailable - ? WHERE id = ?',
      [quantity, printId]
    );

    // Commit transaction
    await db.run('COMMIT');
    res.status(201).json({ id: result.lastID });
  } catch (error) {
    await db.run('ROLLBACK');
    res.status(500).json({ error: error.message });
  }
});

// Update order status (admin only)
router.put('/:id/status', authenticateToken, async (req, res) => {
  const db = req.app.locals.db;
  if (!req.user.isAdmin) {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const { status } = req.body;
  if (!['pending', 'ordered'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  try {
    await db.run(
      'UPDATE orders SET status = ?, statusUpdatedAt = CURRENT_TIMESTAMP WHERE id = ?',
      [status, req.params.id]
    );
    res.json({ message: 'Order status updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update order (user can only update their own pending orders)
router.put('/:id', authenticateToken, async (req, res) => {
  const db = req.app.locals.db;
  const { quantity, description, photosLink } = req.body;

  if (!quantity || quantity <= 0) {
    return res.status(400).json({ error: 'Invalid quantity' });
  }

  try {
    await db.run('BEGIN TRANSACTION');

    // Check if the order exists and belongs to the user
    const order = await db.get(
      'SELECT orders.*, prints.quantityAvailable FROM orders JOIN prints ON orders.printId = prints.id WHERE orders.id = ?',
      [req.params.id]
    );

    if (!order) {
      await db.run('ROLLBACK');
      return res.status(404).json({ error: 'Order not found' });
    }
    if (order.userId !== req.user.id) {
      await db.run('ROLLBACK');
      return res.status(403).json({ error: 'Unauthorized' });
    }
    if (order.status !== 'pending') {
      await db.run('ROLLBACK');
      return res.status(400).json({ error: 'Can only update pending orders' });
    }

    // Calculate quantity difference
    const quantityDiff = quantity - order.quantity;
    
    // Check if enough quantity is available
    if (quantityDiff > 0 && order.quantityAvailable < quantityDiff) {
      await db.run('ROLLBACK');
      return res.status(400).json({ error: 'Not enough quantity available' });
    }

    // Update order
    await db.run(
      'UPDATE orders SET quantity = ?, description = ?, photosLink = ? WHERE id = ?',
      [quantity, description, photosLink, req.params.id]
    );

    // Update print quantity
    await db.run(
      'UPDATE prints SET quantityAvailable = quantityAvailable - ? WHERE id = ?',
      [quantityDiff, order.printId]
    );

    await db.run('COMMIT');
    res.json({ message: 'Order updated successfully' });
  } catch (error) {
    await db.run('ROLLBACK');
    res.status(500).json({ error: error.message });
  }
});

// Delete all orders (admin only)
router.delete('/all', authenticateToken, async (req, res) => {
  console.log('DELETE /api/orders/all endpoint hit');
  const db = req.app.locals.db;
  if (!req.user.isAdmin) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  try {
    const { changes } = await db.run('DELETE FROM orders');
    res.json({ message: 'All orders deleted', deleted: changes });
  } catch (error) {
    console.error('ADMIN DELETE ALL ORDERS ERROR:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete order (user can only delete their own pending orders)
router.delete('/:id', authenticateToken, async (req, res) => {
  const db = req.app.locals.db;
  try {
    await db.run('BEGIN TRANSACTION');

    // Check if the order exists and belongs to the user
    const order = await db.get('SELECT * FROM orders WHERE id = ?', [req.params.id]);
    if (!order) {
      await db.run('ROLLBACK');
      return res.status(404).json({ error: 'Order not found' });
    }
    if (order.userId !== req.user.id) {
      await db.run('ROLLBACK');
      return res.status(403).json({ error: 'Unauthorized' });
    }
    if (order.status !== 'pending') {
      await db.run('ROLLBACK');
      return res.status(400).json({ error: 'Can only delete pending orders' });
    }

    // Return quantity to print
    await db.run(
      'UPDATE prints SET quantityAvailable = quantityAvailable + ? WHERE id = ?',
      [order.quantity, order.printId]
    );

    // Delete order
    await db.run('DELETE FROM orders WHERE id = ?', [req.params.id]);

    await db.run('COMMIT');
    res.json({ message: 'Order deleted successfully' });
  } catch (error) {
    await db.run('ROLLBACK');
    res.status(500).json({ error: error.message });
  }
});

// Get count of user's orders
router.get('/count', authenticateToken, async (req, res) => {
  const db = req.app.locals.db;
  try {
    const result = await db.get(
      'SELECT COUNT(*) as count FROM orders WHERE userId = ? AND status = ?',
      [req.user.id, 'pending']
    );
    console.log('[Order Count Endpoint] userId:', req.user.id, 'result:', result);
    res.json({ count: result.count });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete all orders (admin only)
router.delete('/all', authenticateToken, async (req, res) => {
  console.log('DELETE /api/orders/all endpoint hit');
  const db = req.app.locals.db;
  if (!req.user.isAdmin) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  try {
    const { changes } = await db.run('DELETE FROM orders');
    res.json({ message: 'All orders deleted', deleted: changes });
  } catch (error) {
    console.error('ADMIN DELETE ALL ORDERS ERROR:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
