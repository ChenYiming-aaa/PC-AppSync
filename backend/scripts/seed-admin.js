const path = require('path');
const db = require(path.join(__dirname, '..', 'src', 'db'));
const bcrypt = require('bcryptjs');

const email = 'admin@appsync.local';
const password = 'admin123';
const existing = db.query('SELECT id FROM users WHERE email = ?', [email]);
if (existing.rows.length > 0) {
  console.log('Admin already exists, updating password...');
  const hash = bcrypt.hashSync(password, 10);
  db.query('UPDATE users SET password_hash = ?, is_admin = 1 WHERE email = ?', [hash, email]);
  console.log('Admin password reset to: ' + password);
} else {
  const hash = bcrypt.hashSync(password, 10);
  db.query('INSERT INTO users (email, password_hash, nickname, is_admin) VALUES (?, ?, ?, 1)', [email, hash, 'Admin']);
  console.log('Admin account created: ' + email + ' / ' + password);
}
process.exit(0);
