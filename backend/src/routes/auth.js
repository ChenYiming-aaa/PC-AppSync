const { Router } = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const config = require('../config');
const authMiddleware = require('../middleware/auth');

const router = Router();

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;

router.post('/register', async (req, res) => {
  try {
    const { email, password, nickname } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
    if (!EMAIL_REGEX.test(email)) return res.status(400).json({ error: 'Invalid email format' });
    if (!PASSWORD_REGEX.test(password)) return res.status(400).json({ error: 'Password must be at least 8 characters with letters and numbers' });
    const existing = db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.rows.length > 0) return res.status(409).json({ error: 'Email already registered' });
    const passwordHash = await bcrypt.hash(password, 10);
    db.query('INSERT INTO users (email, password_hash, nickname) VALUES (?, ?, ?)', [email, passwordHash, nickname || email.split('@')[0]]);
    const user = db.query('SELECT id, email, nickname, created_at, token_version FROM users WHERE email = ?', [email]).rows[0];
    const token = jwt.sign({ userId: user.id, tv: user.token_version }, config.jwtSecret, { expiresIn: config.jwtExpiresIn });
    res.status(201).json({ token, user });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
    const result = db.query('SELECT id, email, password_hash, nickname, is_admin, token_version FROM users WHERE email = ?', [email]);
    if (result.rows.length === 0) return res.status(401).json({ error: 'Invalid email or password' });
    const user = result.rows[0];
    if (!await bcrypt.compare(password, user.password_hash)) return res.status(401).json({ error: 'Invalid email or password' });
    const token = jwt.sign({ userId: user.id, isAdmin: !!user.is_admin, tv: user.token_version }, config.jwtSecret, { expiresIn: config.jwtExpiresIn });
    res.json({ token, user: { id: user.id, email: user.email, nickname: user.nickname, is_admin: !!user.is_admin } });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/refresh', authMiddleware, async (req, res) => {
  try {
    const user = db.query('SELECT id, email, nickname, is_admin, token_version FROM users WHERE id = ?', [req.userId]).rows[0];
    if (!user) return res.status(404).json({ error: 'User not found' });
    const token = jwt.sign({ userId: user.id, isAdmin: !!user.is_admin, tv: user.token_version }, config.jwtSecret, { expiresIn: config.jwtExpiresIn });
    res.json({ token, user });
  } catch (err) {
    console.error('Refresh error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const user = db.query('SELECT id, email, nickname, is_admin, created_at FROM users WHERE id = ?', [req.userId]).rows[0];
    if (!user) return res.status(404).json({ error: 'User not found' });
    user.is_admin = !!user.is_admin;
    res.json(user);
  } catch (err) {
    console.error('Profile error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin: list all users
router.get('/users', authMiddleware, async (req, res) => {
  if (!req.isAdmin) return res.status(403).json({ error: 'Admin only' });
  try {
    const rows = db.query(
      `SELECT u.id, u.email, u.nickname, u.is_admin, u.created_at,
        (SELECT COUNT(*) FROM inventories i WHERE i.user_id = u.id) as inventory_count
       FROM users u ORDER BY u.created_at DESC`
    ).rows;
    rows.forEach(r => r.is_admin = !!r.is_admin);
    res.json(rows);
  } catch (err) {
    console.error('List users error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin: toggle admin status
router.put('/users/:id/admin', authMiddleware, async (req, res) => {
  if (!req.isAdmin) return res.status(403).json({ error: 'Admin only' });
  if (parseInt(req.params.id) === req.userId) return res.status(400).json({ error: 'Cannot change your own admin status' });
  try {
    const isAdmin = req.body.is_admin === true ? 1 : 0;
    if (!isAdmin) {
      const adminCount = db.query('SELECT COUNT(*) as count FROM users WHERE is_admin = 1').rows[0].count;
      const target = db.query('SELECT is_admin FROM users WHERE id = ?', [req.params.id]).rows[0];
      if (!target) return res.status(404).json({ error: 'User not found' });
      if (target.is_admin && adminCount <= 1) return res.status(400).json({ error: 'Cannot demote the last admin' });
    }
    db.query('UPDATE users SET is_admin = ? WHERE id = ?', [isAdmin, req.params.id]);
    const user = db.query('SELECT id, email, nickname, is_admin FROM users WHERE id = ?', [req.params.id]).rows[0];
    if (!user) return res.status(404).json({ error: 'User not found' });
    user.is_admin = !!user.is_admin;
    res.json(user);
  } catch (err) {
    console.error('Toggle admin error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin: delete user
router.delete('/users/:id', authMiddleware, async (req, res) => {
  if (!req.isAdmin) return res.status(403).json({ error: 'Admin only' });
  if (parseInt(req.params.id) === req.userId) return res.status(400).json({ error: 'Cannot delete yourself' });
  try {
    const adminCount = db.query('SELECT COUNT(*) as count FROM users WHERE is_admin = 1').rows[0].count;
    const target = db.query('SELECT is_admin FROM users WHERE id = ?', [req.params.id]).rows[0];
    if (!target) return res.status(404).json({ error: 'User not found' });
    if (target.is_admin && adminCount <= 1) return res.status(400).json({ error: 'Cannot delete the last admin' });
    db.query('DELETE FROM users WHERE id = ?', [req.params.id]);
    res.json({ deleted: true });
  } catch (err) {
    console.error('Delete user error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Change password
router.put('/password', authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) return res.status(400).json({ error: 'Current and new password required' });
    if (!PASSWORD_REGEX.test(newPassword)) return res.status(400).json({ error: 'New password must be at least 8 characters with letters and numbers' });
    const user = db.query('SELECT password_hash FROM users WHERE id = ?', [req.userId]).rows[0];
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (!await bcrypt.compare(currentPassword, user.password_hash)) return res.status(401).json({ error: 'Current password is incorrect' });
    const hash = await bcrypt.hash(newPassword, 10);
    db.query('UPDATE users SET password_hash = ?, token_version = token_version + 1, updated_at = datetime(\'now\') WHERE id = ?', [hash, req.userId]);
    const u = db.query('SELECT id, email, nickname, is_admin, token_version FROM users WHERE id = ?', [req.userId]).rows[0];
    const token = jwt.sign({ userId: u.id, isAdmin: !!u.is_admin, tv: u.token_version }, config.jwtSecret, { expiresIn: config.jwtExpiresIn });
    res.json({ updated: true, token, user: { id: u.id, email: u.email, nickname: u.nickname, is_admin: !!u.is_admin } });
  } catch (err) {
    console.error('Change password error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
