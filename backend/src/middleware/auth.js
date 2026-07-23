const jwt = require('jsonwebtoken');
const config = require('../config');
const db = require('../db');

function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid token' });
  }
  try {
    const token = header.slice(7);
    const decoded = jwt.verify(token, config.jwtSecret);
    req.userId = decoded.userId;
    req.isAdmin = decoded.isAdmin || false;

    const user = db.query('SELECT token_version FROM users WHERE id = ?', [req.userId]).rows[0];
    if (!user || (user.token_version || 0) !== (decoded.tv || 0)) {
      return res.status(401).json({ error: 'Token has been invalidated' });
    }

    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

module.exports = authMiddleware;
