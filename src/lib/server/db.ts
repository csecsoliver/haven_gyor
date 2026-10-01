import { env } from '$env/dynamic/private';
import pg from 'pg';
import { defaults } from '$lib/defaults';
import { mergeContent, siteSchema, type Overrides } from '$lib/schema';

let pool: pg.Pool | undefined;
function database() {
  if (!env.DATABASE_URL) throw new Error('DATABASE_URL is not configured');
  // Only connections are pooled. Content is never cached.
  return pool ??= new pg.Pool({ connectionString: env.DATABASE_URL, max: 5 });
}

export async function exportContent() {
  const { rows } = await database().query('SELECT haven.export_content() AS content');
  return siteSchema.parse(rows[0].content);
}

export const loadContent = exportContent;

export async function importContent(content: Overrides) {
  await database().query('SELECT haven.import_content($1::jsonb)', [JSON.stringify(mergeContent(defaults, content))]);
}
