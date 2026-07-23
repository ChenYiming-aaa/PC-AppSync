const path = require('path');
const db = require(path.join(__dirname, '..', 'src', 'db'));
const bcrypt = require('bcryptjs');

const users = [
  { email: 'zhangsan@test.com', password: 'test1234', nickname: '张三' },
  { email: 'lisi@test.com', password: 'test1234', nickname: '李四' },
  { email: 'wangwu@test.com', password: 'test1234', nickname: '王五' },
  { email: 'zhaoliu@test.com', password: 'test1234', nickname: '赵六' },
  { email: 'sunqi@test.com', password: 'test1234', nickname: '孙七' },
];

(async () => {
  for (const u of users) {
    const exist = db.query('SELECT id FROM users WHERE email = ?', [u.email]);
    if (exist.rows.length === 0) {
      const hash = await bcrypt.hash(u.password, 10);
      db.query('INSERT INTO users (email, password_hash, nickname) VALUES (?, ?, ?)', [u.email, hash, u.nickname]);
      console.log('Created:', u.nickname, u.email);
    } else {
      console.log('Already exists:', u.nickname);
    }
  }
  console.log('Done');
  process.exit(0);
})();
