const express = require('express');
const cors = require('cors');
const config = require('./config');
const db = require('./db');
const authRoutes = require('./routes/auth');
const inventoryRoutes = require('./routes/inventories');
const downloadRoutes = require('./routes/downloads');

const app = express();

app.use(cors({
  origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : ['http://localhost:1420', 'http://localhost:3000'],
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.static('public'));

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/inventories', inventoryRoutes);
app.use('/api/v1/downloads', downloadRoutes);

app.get('/api/v1/health', (req, res) => {
  try {
    db.query('SELECT 1');
    res.json({ status: 'ok', db: 'connected' });
  } catch {
    res.status(503).json({ status: 'error', db: 'disconnected' });
  }
});

app.listen(config.port, () => {
  console.log(`AppSync API running on port ${config.port}`);
  console.log('Database: SQLite (appsync.db)');
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  console.error('Unhandled rejection:', err);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down...');
  db.close();
  process.exit(0);
});
