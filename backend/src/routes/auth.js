const { Router } = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const config = require('../config');
const authMiddleware = require('../middleware/auth');

const router = Router();

router.post('/register', async (req, res) => {
  try {
    const { email, password, nickname } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }
    const existing = await db.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Email already registered' });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const result = await db.query(
      'INSERT INTO users (email, password_hash, nickname) VALUES ($1, $2, $3) RETURNING id, email, nickname, created_at',
      [email, passwordHash, nickname || email.split('@')[0]]
    );
    const user = result.rows[0];
    const token = jwt.sign({ userId: user.id }, config.jwtSecret, { expiresIn: config.jwtExpiresIn });
    res.status(201).json({ token, user });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }
    const result = await db.query('SELECT id, email, password_hash, nickname, is_admin FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    const token = jwt.sign({ userId: user.id, isAdmin: user.is_admin }, config.jwtSecret, { expiresIn: config.jwtExpiresIn });
    res.json({
      token,
      user: { id: user.id, email: user.email, nickname: user.nickname, is_admin: user.is_admin }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/refresh', authMiddleware, async (req, res) => {
  try {
    const result = await db.query('SELECT id, email, nickname, is_admin FROM users WHERE id = $1', [req.userId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    const user = result.rows[0];
    const token = jwt.sign({ userId: user.id, isAdmin: user.is_admin }, config.jwtSecret, { expiresIn: config.jwtExpiresIn });
    res.json({ token, user });
  } catch (err) {
    console.error('Refresh error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const result = await db.query('SELECT id, email, nickname, is_admin, created_at FROM users WHERE id = $1', [req.userId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Profile error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin: list all users
router.get('/users', authMiddleware, async (req, res) => {
  if (!req.isAdmin) return res.status(403).json({ error: 'Admin only' });
  try {
    const result = await db.query(
      'SELECT u.id, u.email, u.nickname, u.is_admin, u.created_at, (SELECT COUNT(*) FROM inventories i WHERE i.user_id = u.id) as inventory_count FROM users u ORDER BY u.created_at DESC'
    );
    res.json(result.rows);
  } catch (err) {
    console.error('List users error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin: toggle admin status
router.put('/users/:id/admin', authMiddleware, async (req, res) => {
  if (!req.isAdmin) return res.status(403).json({ error: 'Admin only' });
  try {
    const { is_admin } = req.body;
    const result = await db.query('UPDATE users SET is_admin = $1 WHERE id = $2 RETURNING id, email, nickname, is_admin', [is_admin === true, req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Toggle admin error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin: delete user
router.delete('/users/:id', authMiddleware, async (req, res) => {
  if (!req.isAdmin) return res.status(403).json({ error: 'Admin only' });
  try {
    const result = await db.query('DELETE FROM users WHERE id = $1 RETURNING id', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
    res.json({ deleted: true });
  } catch (err) {
    console.error('Delete user error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
