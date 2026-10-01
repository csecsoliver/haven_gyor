import { readFile } from 'node:fs/promises';
import pg from 'pg';
import { seedDefaults } from './seed.mjs';

if (!process.env.DATABASE_URL) throw new Error('Set DATABASE_URL before running migrations.');
const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
try {
  await client.connect();
  await client.query(await readFile(new URL('../db/001_content.sql', import.meta.url), 'utf8'));
  await seedDefaults(client);
  console.log('Haven schema and default content are ready.');
} finally {
  await client.end();
}
