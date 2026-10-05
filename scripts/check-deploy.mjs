import { readFileSync } from 'node:fs';

// wrangler.jsonc currently contains JSON without comments.
const config = JSON.parse(readFileSync(new URL('../wrangler.jsonc', import.meta.url), 'utf8'));
const database = config.d1_databases?.find(db => db.binding === 'REVIEWS_DB');
if (!database || !/^[a-f\d]{8}(?:-[a-f\d]{4}){3}-[a-f\d]{12}$/i.test(database.database_id)) {
  console.error('Deployment blocked: set REVIEWS_DB.database_id in wrangler.jsonc to your Cloudflare D1 database UUID, then apply the remote migration. See README.md.');
  process.exit(1);
}
console.log('Production database ID is configured. Make sure its remote migrations are applied before deploying.');
