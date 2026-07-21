const { Router } = require('express');
const db = require('../db');
const authMiddleware = require('../middleware/auth');

const router = Router();

router.use(authMiddleware);

router.post('/', async (req, res) => {
  try {
    const { scan_data, machine_name, scan_mode } = req.body;
    if (!scan_data) {
      return res.status(400).json({ error: 'scan_data required' });
    }
    const data = JSON.stringify(scan_data).replace(/\\u0000/g, '').replace(/\0/g, '');
    const result = await db.query(
      'INSERT INTO inventories (user_id, scan_data, machine_name, scan_mode, scan_time) VALUES ($1, $2, $3, $4, NOW()) RETURNING id, created_at',
      [req.userId, data, machine_name || null, scan_mode || 'standard']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Upload inventory error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/', async (req, res) => {
  try {
    const result = await db.query(
      'SELECT id, machine_name, scan_mode, scan_time, created_at FROM inventories WHERE user_id = $1 ORDER BY scan_time DESC',
      [req.userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('List inventories error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/latest', async (req, res) => {
  try {
    const result = await db.query(
      'SELECT id, machine_name, scan_mode, scan_time, scan_data, created_at FROM inventories WHERE user_id = $1 ORDER BY scan_time DESC LIMIT 1',
      [req.userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No inventory found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Get latest inventory error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await db.query(
      'SELECT id, machine_name, scan_mode, scan_time, scan_data, created_at FROM inventories WHERE id = $1 AND user_id = $2',
      [req.params.id, req.userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Inventory not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Get inventory error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await db.query(
      'DELETE FROM inventories WHERE id = $1 AND user_id = $2 RETURNING id',
      [req.params.id, req.userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Inventory not found' });
    }
    res.json({ deleted: true });
  } catch (err) {
    console.error('Delete inventory error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
