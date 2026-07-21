const path = require('path');
const db = require(path.join(__dirname, '..', 'src', 'db'));
const bcrypt = require('bcryptjs');

async function seedAdmin() {
  const email = 'admin@appsync.local';
  const password = 'admin123';
  const existing = await db.query('SELECT id FROM users WHERE email = $1', [email]);
  if (existing.rows.length > 0) {
    console.log('Admin already exists, updating password...');
    const hash = await bcrypt.hash(password, 10);
    await db.query('UPDATE users SET password_hash = $1, is_admin = true WHERE email = $2', [hash, email]);
    console.log('Admin password reset to: ' + password);
  } else {
    const hash = await bcrypt.hash(password, 10);
    await db.query(
      'INSERT INTO users (email, password_hash, nickname, is_admin) VALUES ($1, $2, $3, true)',
      [email, hash, 'Admin']
    );
    console.log('Admin account created: ' + email + ' / ' + password);
  }
  process.exit(0);
}

seedAdmin().catch(err => { console.error(err); process.exit(1); });
