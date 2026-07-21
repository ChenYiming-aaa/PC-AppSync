const db = require('./db');
const links = require('../data/builtin-links.json');

let count = 0;
for (const link of links) {
  const existing = db.query('SELECT id FROM download_links WHERE software_name = ?', [link.software_name]);
  if (existing.rows.length === 0) {
    db.query(
      'INSERT INTO download_links (software_name, aliases, official_url, direct_download_url, category, verified) VALUES (?, ?, ?, ?, ?, ?)',
      [link.software_name, JSON.stringify(link.aliases || []), link.official_url, link.direct_download_url || null, link.category || null, link.verified ? 1 : 0]
    );
    count++;
  }
}
console.log('Seeded ' + count + ' new links');
process.exit(0);
