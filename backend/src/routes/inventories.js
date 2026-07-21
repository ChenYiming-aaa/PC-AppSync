const { Router } = require('express');
const db = require('../db');
const authMiddleware = require('../middleware/auth');

const router = Router();

router.use(authMiddleware);

router.post('/', async (req, res) => {
  try {
    const { scan_data, machine_name, scan_mode } = req.body;
    if (!scan_data) {
      return res.status(400).json({ error: 'scan_data required' });
    }
    const data = JSON.stringify(scan_data).replace(/\\u0000/g, '').replace(/\0/g, '');
    const result = await db.query(
      'INSERT INTO inventories (user_id, scan_data, machine_name, scan_mode, scan_time) VALUES ($1, $2, $3, $4, NOW()) RETURNING id, created_at',
      [req.userId, data, machine_name || null, scan_mode || 'standard']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Upload inventory error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/', async (req, res) => {
  try {
    const result = await db.query(
      'SELECT id, machine_name, scan_mode, scan_time, created_at FROM inventories WHERE user_id = $1 ORDER BY scan_time DESC',
      [req.userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('List inventories error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/latest', async (req, res) => {
  try {
    const result = await db.query(
      'SELECT id, machine_name, scan_mode, scan_time, scan_data, created_at FROM inventories WHERE user_id = $1 ORDER BY scan_time DESC LIMIT 1',
      [req.userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No inventory found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Get latest inventory error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Compare: find apps in another inventory that are NOT in the current machine's
// GET /api/v1/inventories/compare?other_id=xxx
router.get('/compare', async (req, res) => {
  try {
    const otherId = parseInt(req.query.other_id, 10);
    if (!otherId) {
      return res.status(400).json({ error: 'other_id query param required' });
    }

    // Get current user's latest inventory
    const currentResult = await db.query(
      "SELECT id, machine_name, scan_data FROM inventories WHERE user_id = $1 ORDER BY scan_time DESC LIMIT 1",
      [req.userId]
    );

    // Get the other inventory (must belong to same user)
    const otherResult = await db.query(
      "SELECT id, machine_name, scan_data FROM inventories WHERE id = $1 AND user_id = $2",
      [otherId, req.userId]
    );

    if (otherResult.rows.length === 0) {
      return res.status(404).json({ error: 'Other inventory not found' });
    }

    const current = currentResult.rows[0];
    const other = otherResult.rows[0];
    const currentScan = current ? current.scan_data : { applications: [], runtimes: [] };
    const otherScan = other.scan_data;

    // Build name sets for comparison (case-insensitive)
    const currentAppNames = new Set(
      (currentScan.applications || []).map((a) => a.name.toLowerCase())
    );
    const currentRuntimeNames = new Set(
      (currentScan.runtimes || []).map((r) => r.name.toLowerCase())
    );

    // Apps on old machine but NOT on current machine
    const missingApps = (otherScan.applications || []).filter(
      (a) => !currentAppNames.has(a.name.toLowerCase())
    );
    // Runtimes on old machine but NOT on current machine
    const missingRuntimes = (otherScan.runtimes || []).filter(
      (r) => !currentRuntimeNames.has(r.name.toLowerCase())
    );
    // Apps present on both
    const commonApps = (otherScan.applications || []).filter((a) =>
      currentAppNames.has(a.name.toLowerCase())
    );

    res.json({
      current_machine: current ? current.machine_name : null,
      other_machine: other.machine_name,
      other_inventory_id: other.id,
      missing_apps: missingApps,
      missing_runtimes: missingRuntimes,
      common_count: commonApps.length,
      missing_count: missingApps.length,
    });
  } catch (err) {
    console.error('Compare error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await db.query(
      'SELECT id, machine_name, scan_mode, scan_time, scan_data, created_at FROM inventories WHERE id = $1 AND user_id = $2',
      [req.params.id, req.userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Inventory not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Get inventory error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await db.query(
      'DELETE FROM inventories WHERE id = $1 AND user_id = $2 RETURNING id',
      [req.params.id, req.userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Inventory not found' });
    }
    res.json({ deleted: true });
  } catch (err) {
    console.error('Delete inventory error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
