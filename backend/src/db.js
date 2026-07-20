const { Pool } = require('pg');
const config = require('./config');

const pool = new Pool({
  connectionString: config.databaseUrl,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  console.error('Database pool error:', err.message);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  healthCheck: async () => {
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
  },
  pool,
};
