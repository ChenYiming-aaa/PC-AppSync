const { Router } = require('express');
const db = require('../db');
const authMiddleware = require('../middleware/auth');

function sanitizeStrings(obj) {
  if (typeof obj === 'string') return obj.replace(/\0/g, '');
  if (Array.isArray(obj)) return obj.map(sanitizeStrings);
  if (obj && typeof obj === 'object') {
    const cleaned = {};
    for (const [k, v] of Object.entries(obj)) cleaned[k] = sanitizeStrings(v);
    return cleaned;
  }
  return obj;
}

const router = Router();
router.use(authMiddleware);

router.post('/', async (req, res) => {
  try {
    const { scan_data, machine_name, scan_mode, scan_time } = req.body;
    if (!scan_data) return res.status(400).json({ error: 'scan_data required' });
    const data = JSON.stringify(sanitizeStrings(scan_data));
    const r = db.query(
      'INSERT INTO inventories (user_id, scan_data, machine_name, scan_mode, scan_time) VALUES (?, ?, ?, ?, ?) RETURNING id',
      [req.userId, data, machine_name || null, scan_mode || 'standard', scan_time || new Date().toISOString()]
    );
    res.status(201).json({ id: Number(r.rows[0].id) });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/', async (req, res) => {
  try {
    const r = db.query(
      'SELECT id, machine_name, scan_mode, scan_time, created_at FROM inventories WHERE user_id = ? ORDER BY scan_time DESC',
      [req.userId]
    );
    res.json(r.rows);
  } catch (err) {
    console.error('List error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/latest', async (req, res) => {
  try {
    const r = db.query(
      'SELECT id, machine_name, scan_mode, scan_time, scan_data, created_at FROM inventories WHERE user_id = ? ORDER BY scan_time DESC LIMIT 1',
      [req.userId]
    );
    if (r.rows.length === 0) return res.status(404).json({ error: 'No inventory found' });
    r.rows[0].scan_data = JSON.parse(r.rows[0].scan_data);
    res.json(r.rows[0]);
  } catch (err) {
    console.error('Get latest error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Compare: find apps in another inventory not on current machine
router.get('/compare', async (req, res) => {
  try {
    const otherId = parseInt(req.query.other_id, 10);
    if (!otherId) return res.status(400).json({ error: 'other_id required' });
    const cur = db.query("SELECT id, machine_name, scan_data FROM inventories WHERE user_id = ? ORDER BY scan_time DESC LIMIT 1", [req.userId]).rows[0];
    const other = db.query("SELECT id, machine_name, scan_data FROM inventories WHERE id = ? AND user_id = ?", [otherId, req.userId]).rows[0];
    if (!other) return res.status(404).json({ error: 'Other inventory not found' });
    const currentScan = cur ? JSON.parse(cur.scan_data) : { applications: [], runtimes: [] };
    const otherScan = JSON.parse(other.scan_data);
    const currentNames = new Set((currentScan.applications || []).map(a => a.name.toLowerCase()));
    const currentRtNames = new Set((currentScan.runtimes || []).map(r => r.name.toLowerCase()));
    res.json({
      current_machine: cur ? cur.machine_name : null,
      other_machine: other.machine_name,
      other_inventory_id: other.id,
      missing_apps: (otherScan.applications || []).filter(a => !currentNames.has(a.name.toLowerCase())),
      missing_runtimes: (otherScan.runtimes || []).filter(r => !currentRtNames.has(r.name.toLowerCase())),
      common_count: (otherScan.applications || []).filter(a => currentNames.has(a.name.toLowerCase())).length,
      missing_count: (otherScan.applications || []).filter(a => !currentNames.has(a.name.toLowerCase())).length,
    });
  } catch (err) {
    console.error('Compare error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const r = db.query('SELECT id, machine_name, scan_mode, scan_time, scan_data, created_at FROM inventories WHERE id = ? AND user_id = ?', [req.params.id, req.userId]);
    if (r.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    r.rows[0].scan_data = JSON.parse(r.rows[0].scan_data);
    res.json(r.rows[0]);
  } catch (err) {
    console.error('Get error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const r = db.query('DELETE FROM inventories WHERE id = ? AND user_id = ?', [req.params.id, req.userId]);
    if (r.changes === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ deleted: true });
  } catch (err) {
    console.error('Delete error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
