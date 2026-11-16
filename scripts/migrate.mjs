import { readdir, readFile } from 'node:fs/promises';
import pg from 'pg';
import { seedDefaults } from './seed.mjs';

if (!process.env.DATABASE_URL) throw new Error('Set DATABASE_URL before running migrations.');
const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
try {
  await client.connect();
  const dir = new URL('../db/', import.meta.url);
  const files = (await readdir(dir)).filter((name) => name.endsWith('.sql')).sort();
  for (const name of files) {
    await client.query(await readFile(new URL(name, dir), 'utf8'));
  }
  await seedDefaults(client);
  console.log('Database schema and default content are ready.');
} finally {
  await client.end();
}
