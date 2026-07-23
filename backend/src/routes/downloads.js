const { Router } = require('express');
const db = require('../db');
const authMiddleware = require('../middleware/auth');

const router = Router();
router.use(authMiddleware);

function isValidUrl(str) {
  try { const url = new URL(str); return ['http:', 'https:'].includes(url.protocol); }
  catch { return false; }
}

router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.status(400).json({ error: 'Query param q required' });
    const r = db.query(
      `SELECT id, software_name, aliases, official_url, direct_download_url, category, verified, contributor_id
       FROM download_links
       WHERE LOWER(software_name) LIKE LOWER(?) OR LOWER(aliases) LIKE LOWER(?)
       ORDER BY verified DESC, software_name ASC LIMIT 20`,
      [`%${q}%`, `%${q}%`]
    );
    r.rows.forEach(row => {
      row.verified = !!row.verified;
      try { row.aliases = JSON.parse(row.aliases); } catch { row.aliases = []; }
    });
    res.json(r.rows);
  } catch (err) {
    console.error('Search error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/links', async (req, res) => {
  try {
    const { software_name, aliases, official_url, direct_download_url, category } = req.body;
    if (!software_name || !official_url) return res.status(400).json({ error: 'software_name and official_url required' });
    if (!isValidUrl(official_url)) return res.status(400).json({ error: 'official_url must be a valid http/https URL' });
    const r = db.query(
      'INSERT INTO download_links (software_name, aliases, official_url, direct_download_url, category, contributor_id) VALUES (?, ?, ?, ?, ?, ?)',
      [software_name, JSON.stringify(aliases || []), official_url, direct_download_url || null, category || null, req.userId]
    );
    res.status(201).json({ id: Number(r.rows[0].id), message: 'Submitted for review' });
  } catch (err) {
    console.error('Submit error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/links/pending', async (req, res) => {
  if (!req.isAdmin) return res.status(403).json({ error: 'Admin only' });
  try {
    const r = db.query(
      'SELECT dl.*, u.email as contributor_email FROM download_links dl LEFT JOIN users u ON dl.contributor_id = u.id WHERE dl.verified = 0 ORDER BY dl.created_at ASC'
    );
    r.rows.forEach(row => { try { row.aliases = JSON.parse(row.aliases); } catch { row.aliases = []; } });
    res.json(r.rows);
  } catch (err) {
    console.error('Pending error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/links/:id/verify', async (req, res) => {
  if (!req.isAdmin) return res.status(403).json({ error: 'Admin only' });
  try {
    if (req.body.verified === true) {
      const r = db.query('UPDATE download_links SET verified = 1, updated_at = datetime(\'now\') WHERE id = ?', [req.params.id]);
      if (r.changes === 0) return res.status(404).json({ error: 'Not found' });
      res.json({ updated: true });
    } else {
      const r = db.query('DELETE FROM download_links WHERE id = ?', [req.params.id]);
      if (r.changes === 0) return res.status(404).json({ error: 'Not found' });
      res.json({ deleted: true });
    }
  } catch (err) {
    console.error('Verify error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

const CHUNK_SIZE = 50;

function normalizeLinkRow(row) {
  try { row.aliases = JSON.parse(row.aliases); } catch { row.aliases = []; }
  row.verified = !!row.verified;
  return row;
}

// Batch match: POST /match — accepts { names: string[] }, returns matched links keyed by name
router.post('/match', async (req, res) => {
  try {
    const { names } = req.body;
    if (!Array.isArray(names) || names.length === 0) return res.status(400).json({ error: 'names array required' });
    // Process in chunks to avoid SQL blob/limit issues
    const result = {};
    for (let i = 0; i < names.length; i += CHUNK_SIZE) {
      const chunk = names.slice(i, i + CHUNK_SIZE);
      const clauses = chunk.map(() => `(LOWER(software_name) LIKE LOWER(?) OR LOWER(aliases) LIKE LOWER(?))`);
      const params = chunk.flatMap(n => [`%${n}%`, `%${n}%`]);
      const rows = db.query(
        `SELECT software_name, aliases, official_url, direct_download_url, category, verified, contributor_id
         FROM download_links WHERE ${clauses.join(' OR ')} ORDER BY verified DESC, software_name ASC`,
        params
      ).rows;
      for (const r of rows) {
        normalizeLinkRow(r);
        if (!result[r.software_name] || (r.verified && !result[r.software_name].verified)) {
          result[r.software_name] = r;
        }
      }
    }
    res.json(result);
  } catch (err) {
    console.error('Batch match error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// List all links with pagination + search
router.get('/links', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const q = req.query.q || '';
    const offset = (page - 1) * limit;

    let where = '';
    const params = [];
    if (q) {
      where = 'WHERE LOWER(software_name) LIKE LOWER(?) OR LOWER(aliases) LIKE LOWER(?)';
      params.push(`%${q}%`, `%${q}%`);
    }

    const countR = db.query(`SELECT COUNT(*) as total FROM download_links ${where}`, params);
    const total = countR.rows[0].total;

    params.push(limit, offset);
    const r = db.query(
      `SELECT id, software_name, aliases, official_url, direct_download_url, category, verified, contributor_id
       FROM download_links ${where} ORDER BY verified DESC, software_name ASC LIMIT ? OFFSET ?`, params
    );
    r.rows.forEach(row => {
      row.verified = !!row.verified;
      try { row.aliases = JSON.parse(row.aliases); } catch { row.aliases = []; }
    });

    res.json({ links: r.rows, total, page, limit, pages: Math.ceil(total / limit) });
  } catch (err) {
    console.error('List links error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
