import { env } from '$env/dynamic/private';
import pg from 'pg';
import { defaults } from '$lib/defaults';
import { mergeContent, overridesSchema, type Overrides } from '$lib/schema';

let pool: pg.Pool | undefined;
function database() {
  if (!env.DATABASE_URL) throw new Error('DATABASE_URL is not configured');
  // Only connections are pooled. Content is never cached.
  return pool ??= new pg.Pool({ connectionString: env.DATABASE_URL, max: 5 });
}

export async function exportContent(): Promise<Overrides> {
  const { rows } = await database().query('SELECT haven.export_content() AS content');
  return overridesSchema.parse(rows[0].content);
}

export async function loadContent() {
  return mergeContent(defaults, await exportContent());
}

export async function importContent(content: Overrides) {
  await database().query('SELECT haven.import_content($1::jsonb)', [JSON.stringify(content)]);
}
