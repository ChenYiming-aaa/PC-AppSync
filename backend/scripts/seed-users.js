const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const users = [
  { email: 'zhangsan@test.com', password: '123456', nickname: '张三' },
  { email: 'lisi@test.com', password: '123456', nickname: '李四' },
  { email: 'wangwu@test.com', password: '123456', nickname: '王五' },
  { email: 'zhaoliu@test.com', password: '123456', nickname: '赵六' },
  { email: 'sunqi@test.com', password: '123456', nickname: '孙七' },
];

(async () => {
  for (const u of users) {
    const exist = await pool.query('SELECT id FROM users WHERE email = $1', [u.email]);
    if (exist.rows.length === 0) {
      const hash = await bcrypt.hash(u.password, 10);
      await pool.query('INSERT INTO users (email, password_hash, nickname) VALUES ($1, $2, $3)', [u.email, hash, u.nickname]);
      console.log('Created:', u.nickname, u.email);
    } else {
      console.log('Already exists:', u.nickname);
    }
  }
  console.log('Done');
  process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
