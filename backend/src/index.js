const express = require('express');
const cors = require('cors');
const config = require('./config');
const db = require('./db');
const authRoutes = require('./routes/auth');
const inventoryRoutes = require('./routes/inventories');
const downloadRoutes = require('./routes/downloads');

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static('public'));

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/inventories', inventoryRoutes);
app.use('/api/v1/downloads', downloadRoutes);

app.get('/api/v1/health', async (req, res) => {
  try {
    await db.healthCheck();
    res.json({ status: 'ok', db: 'connected' });
  } catch (err) {
    res.status(503).json({ status: 'error', db: 'disconnected' });
  }
});

app.listen(config.port, async () => {
  console.log(`AppSync API running on port ${config.port}`);
  try {
    await db.healthCheck();
    console.log('Database connected');
  } catch (err) {
    console.error('Database connection failed:', err.message);
    process.exit(1);
  }
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  console.error('Unhandled rejection:', err);
});

process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down...');
  await db.pool.end();
  process.exit(0);
});
