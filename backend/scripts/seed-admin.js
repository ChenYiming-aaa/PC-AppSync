const path = require('path');
const db = require(path.join(__dirname, '..', 'src', 'db'));
const bcrypt = require('bcryptjs');

const email = 'admin@appsync.local';
const password = 'admin123';
const existing = db.query('SELECT id FROM users WHERE email = ?', [email]);
(async () => {
  const hash = await bcrypt.hash(password, 10);
  if (existing.rows.length > 0) {
    console.log('Admin already exists, updating password...');
    db.query('UPDATE users SET password_hash = ?, is_admin = 1, token_version = token_version + 1 WHERE email = ?', [hash, email]);
    console.log('Admin password has been reset');
  } else {
    db.query('INSERT INTO users (email, password_hash, nickname, is_admin) VALUES (?, ?, ?, 1)', [email, hash, 'Admin']);
    console.log('Admin account created: ' + email);
  }
  process.exit(0);
})();
