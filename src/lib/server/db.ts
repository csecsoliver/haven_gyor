import { env } from '$env/dynamic/private';
import pg from 'pg';
import { defaults } from '$lib/defaults';
import { leaderboardSchema, mergeContent, siteSchema, type LeaderboardEntry, type Overrides } from '$lib/schema';

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

export async function loadLeaderboard(): Promise<LeaderboardEntry[]> {
  const { rows } = await database().query(`
    SELECT l.id, l.rank, l.name, l.url, l.source_url,
           coalesce(json_agg(jsonb_build_object('name', a.name, 'email', a.email) ORDER BY a.name)
                    FILTER (WHERE a.id IS NOT NULL), '[]') AS authors
    FROM haven.leaderboard l
    LEFT JOIN haven.authors a ON a.project_id = l.id
    GROUP BY l.id
    ORDER BY l.rank, l.name, l.id
  `);
  return leaderboardSchema.parse(rows);
}

export async function importContent(content: Overrides) {
  await database().query('SELECT haven.import_content($1::jsonb)', [JSON.stringify(mergeContent(defaults, content))]);
}
