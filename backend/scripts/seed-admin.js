const path = require('path');
const db = require(path.join(__dirname, '..', 'src', 'db'));
const bcrypt = require('bcryptjs');

const email = 'admin@appsync.local';
const password = 'admin123';
const existing = db.query('SELECT id FROM users WHERE email = ?', [email]);
(async () => {
  const hash = await bcrypt.hash(password, 10);
  if (existing.rows.length > 0) {
    console.log('Admin already exists, ensuring admin status...');
    db.query('UPDATE users SET is_admin = 1 WHERE email = ?', [email]);
    console.log('Admin status confirmed');
  } else {
    db.query('INSERT INTO users (email, password_hash, nickname, is_admin) VALUES (?, ?, ?, 1)', [email, hash, 'Admin']);
    console.log('Admin account created: ' + email);
  }
  process.exit(0);
})();
