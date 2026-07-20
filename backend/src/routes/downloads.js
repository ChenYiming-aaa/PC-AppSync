const { Router } = require('express');
const db = require('../db');
const authMiddleware = require('../middleware/auth');

const router = Router();
router.use(authMiddleware);

router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.status(400).json({ error: 'Query param q required' });
    const result = await db.query(
      'SELECT id, software_name, aliases, official_url, direct_download_url, category, verified FROM download_links WHERE software_name ILIKE $1 OR $2 = ANY(aliases) ORDER BY verified DESC, software_name ASC LIMIT 20',
      ['%' + q + '%', q]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Search error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/links', async (req, res) => {
  try {
    const { software_name, aliases, official_url, direct_download_url, category } = req.body;
    if (!software_name || !official_url) {
      return res.status(400).json({ error: 'software_name and official_url required' });
    }
    const result = await db.query(
      'INSERT INTO download_links (software_name, aliases, official_url, direct_download_url, category, contributor_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
      [software_name, aliases || [], official_url, direct_download_url || null, category || null, req.userId]
    );
    res.status(201).json({ id: result.rows[0].id, message: 'Submitted for review' });
  } catch (err) {
    console.error('Submit link error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/links/pending', async (req, res) => {
  if (!req.isAdmin) return res.status(403).json({ error: 'Admin only' });
  try {
    const result = await db.query(
      'SELECT dl.*, u.email as contributor_email FROM download_links dl LEFT JOIN users u ON dl.contributor_id = u.id WHERE dl.verified = false ORDER BY dl.created_at ASC'
    );
    res.json(result.rows);
  } catch (err) {
    console.error('List pending error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/links/:id/verify', async (req, res) => {
  if (!req.isAdmin) return res.status(403).json({ error: 'Admin only' });
  try {
    const result = await db.query(
      'UPDATE download_links SET verified = $1, updated_at = NOW() WHERE id = $2 RETURNING id',
      [req.body.verified === true, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ updated: true });
  } catch (err) {
    console.error('Verify error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
