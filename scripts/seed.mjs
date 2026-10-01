import { defaults } from '../src/lib/defaults.ts';
import { mergeContent, overridesSchema } from '../src/lib/schema.ts';

/** @param {{ query: (sql: string, params?: unknown[]) => Promise<{ rows: Record<string, unknown>[] }> }} client */
export async function seedDefaults(client) {
  await client.query('BEGIN');
  try {
    await client.query('SELECT pg_advisory_xact_lock(150150)');
    await client.query('CREATE TABLE IF NOT EXISTS haven.migration (name text PRIMARY KEY)');
    const applied = await client.query("SELECT name FROM haven.migration WHERE name = '002_defaults'");
    if (!applied.rows.length) {
      await client.query('SELECT id FROM haven.site WHERE id = true FOR UPDATE');
      const { rows } = await client.query('SELECT haven.export_content() AS content');
      const content = mergeContent(defaults, overridesSchema.parse(rows[0].content));
      await client.query('SELECT haven.import_content($1::jsonb)', [JSON.stringify(content)]);
      await client.query("INSERT INTO haven.migration (name) VALUES ('002_defaults')");
    }
    await client.query('COMMIT');
  } catch (cause) {
    await client.query('ROLLBACK');
    throw cause;
  }
}
