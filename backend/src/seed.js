const db = require('./db');
const links = require('../data/builtin-links.json');

async function seed() {
  console.log('Seeding download links...');
  let count = 0;
  for (const link of links) {
    const existing = await db.query('SELECT id FROM download_links WHERE software_name = $1', [link.software_name]);
    if (existing.rows.length === 0) {
      await db.query(
        'INSERT INTO download_links (software_name, aliases, official_url, direct_download_url, category, verified) VALUES ($1, $2, $3, $4, $5, $6)',
        [link.software_name, link.aliases, link.official_url, link.direct_download_url || null, link.category, link.verified]
      );
      count++;
    }
  }
  console.log('Seeded ' + count + ' new links');
  process.exit(0);
}

seed().catch(err => { console.error(err); process.exit(1); });
