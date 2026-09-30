import { readFile } from 'node:fs/promises';
import pg from 'pg';

if (!process.env.DATABASE_URL) throw new Error('Set DATABASE_URL before running migrations.');
const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
try {
  await client.connect();
  await client.query(await readFile(new URL('../db/001_content.sql', import.meta.url), 'utf8'));
  console.log('Haven schema is ready.');
} finally {
  await client.end();
}
