import { readdir, readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
import pg from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { defaults } from '../src/lib/defaults';
import { mergeContent, overridesSchema } from '../src/lib/schema';
import { seedDefaults } from '../scripts/seed.mjs';

// PGlite runs real PostgreSQL/PLpgSQL in memory, without a database service.
// An optional managed connection MUST point to a disposable test database.
const connectionString = process.env.TEST_DATABASE_URL;
describe('PostgreSQL import/export', () => {
  const managed = connectionString ? new pg.Client({ connectionString }) : undefined;
  const memory = managed ? undefined : new PGlite();
  const client = {
    query: async (sql: string, params?: unknown[]) => managed
      ? managed.query(sql, params)
      : memory!.query<Record<string, unknown>>(sql, params)
  };
  const migrate = async () => {
    const files = (await readdir('db')).filter((name) => name.endsWith('.sql')).sort();
    for (const name of files) {
      const sql = await readFile(`db/${name}`, 'utf8');
      if (managed) await managed.query(sql);
      else await memory!.exec(sql);
    }
    await seedDefaults(client);
  };
  beforeAll(async () => {
    if (managed) await managed.connect();
    await migrate();
  }, 30000);
  afterAll(async () => {
    if (managed) await managed.end();
    else await memory!.close();
  });
  const read = async () => (await client.query('SELECT haven.export_content() AS content')).rows[0].content;
  const write = async (value: unknown) => client.query('SELECT haven.import_content($1::jsonb)', [JSON.stringify(value)]);

  it('seeds all defaults and relational FAQ entries on a fresh database', async () => {
    expect(await read()).toEqual(defaults);
    expect((await client.query('SELECT count(*)::int AS n FROM haven.faq')).rows[0].n).toBe(defaults.faq.items.length);
  });
  it('fills missing defaults in an existing database without replacing custom or empty collections', async () => {
    const custom = overridesSchema.parse({ hero: { signup: { button: 'Join us' } }, faq: { items: [] } });
    await write(custom);
    await client.query("DELETE FROM haven.migration WHERE name = '002_defaults'");
    await migrate();
    expect(await read()).toEqual(mergeContent(defaults, custom));
    await migrate();
    expect(await read()).toEqual(mergeContent(defaults, custom));
  });
  it('round-trips ordered FAQ segments, links, marks, and schedule children', async () => {
    const content = overridesSchema.parse({
      tagline: ['teens', 'Győr'],
      faq: [
        { q: 'First', a: [{ text: 'one', mark: false }, { text: ' two', href: 'https://hackclub.com' }] },
        { q: 'Second', a: [] }
      ],
      schedule: { days: [
        { day: 'Saturday', items: [{ time: '10:00', title: 'Doors', body: '' }, { time: '11:00', title: 'Build' }] },
        { day: 'Sunday', items: [] }
      ] },
      about: { title: 'Custom title' }
    });
    await write(content);
    expect(await read()).toEqual(content);
    expect((await client.query('SELECT count(*)::int AS n FROM haven.faq_segment')).rows[0].n).toBe(2);
  });
  it('rolls back failed imports, keeping all previous content', async () => {
    const previous = await read();
    await expect(write({ faq: { items: [{ q: 'Broken', a: [{ text: 123 }] }] } })).rejects.toThrow();
    expect(await read()).toEqual(previous);
    await expect(write({ unexpected: {} })).rejects.toThrow();
    expect(await read()).toEqual(previous);
  });
  it('distinguishes absent collections from explicit empty collections', async () => {
    await write({ faq: { heading: 'Questions' }, schedule: { heading: 'Plan' } });
    expect(await read()).toEqual({ faq: { heading: 'Questions' }, schedule: { heading: 'Plan' } });
    await write({ faq: { items: [] }, schedule: { days: [] } });
    expect(await read()).toEqual({ faq: { items: [] }, schedule: { days: [] } });
    await write({});
    expect(await read()).toEqual({});
  });
  it('exports directly inserted children without section markers', async () => {
    for (const base of [{}, { schedule: { heading: 'Plan' }, faq: { heading: 'Questions' } }]) {
      await write(base);
      await client.query("INSERT INTO haven.schedule_day (position, label) VALUES (0, 'Saturday')");
      await client.query("INSERT INTO haven.schedule_item (day_position, position, time, title) VALUES (0, 0, '10:00', 'Doors')");
      await client.query("INSERT INTO haven.faq (position, question) VALUES (0, 'Where?')");
      await client.query("INSERT INTO haven.faq_segment (faq_position, position, text) VALUES (0, 0, 'Győr')");
      const content = overridesSchema.parse(await read());
      expect(content.schedule).toEqual({
        ...('schedule' in base ? base.schedule : {}),
        days: [{ day: 'Saturday', items: [{ time: '10:00', title: 'Doors' }] }]
      });
      expect(content.faq).toEqual({
        ...('faq' in base ? base.faq : {}),
        items: [{ q: 'Where?', a: [{ text: 'Győr' }] }]
      });
    }
  });
  it('is idempotent to migrate and does not erase content', async () => {
    await write({ tagline: ['keep me'] });
    await migrate();
    expect(await read()).toEqual({ tagline: ['keep me'] });
  });
  it('creates haven.leaderboard and haven.authors with uuid ids, NOT NULL columns, and a nullable project_id FK', async () => {
    await client.query(
      "INSERT INTO haven.leaderboard (rank, name, url, source_url) VALUES (1, 'Alpha', 'https://alpha.example', 'https://github.com/example/alpha')"
    );
    const { rows } = await client.query('SELECT id, rank, name, url, source_url FROM haven.leaderboard ORDER BY rank, name, id');
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ rank: 1, name: 'Alpha', url: 'https://alpha.example', source_url: 'https://github.com/example/alpha' });
    expect(rows[0].id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);

    // project_id is nullable; the other authors columns are not.
    await client.query("INSERT INTO haven.authors (name, email) VALUES ('Ada', 'ada@example.com')");
    await client.query('INSERT INTO haven.authors (name, email, project_id) VALUES ($1, $2, $3)', ['Cleo', 'cleo@example.com', rows[0].id]);
    await expect(client.query("INSERT INTO haven.authors (email, project_id) VALUES ('x@example.com', NULL)")).rejects.toThrow();
    await expect(client.query('INSERT INTO haven.authors (name, project_id) VALUES ($1, NULL)', ['No email'])).rejects.toThrow();
    // project_id must reference an existing leaderboard entry.
    await expect(client.query("INSERT INTO haven.authors (name, email, project_id) VALUES ('Bob', 'bob@example.com', '99999999-9999-4999-8999-999999999999')")).rejects.toThrow();
    // leaderboard columns are all NOT NULL.
    await expect(client.query("INSERT INTO haven.leaderboard (name, url) VALUES ('No source', 'https://x.example')")).rejects.toThrow();
    await expect(client.query("INSERT INTO haven.leaderboard (name, source_url) VALUES ('No url', 'https://x.example')")).rejects.toThrow();
    await expect(client.query("INSERT INTO haven.leaderboard (url, source_url) VALUES ('https://x.example', 'https://x.example')")).rejects.toThrow();
    await expect(client.query("INSERT INTO haven.leaderboard (name, url, source_url) VALUES ('No rank', 'https://x.example', 'https://x.example')")).rejects.toThrow();
    // The FK has no ON DELETE action: a referenced project cannot be deleted.
    await expect(client.query('DELETE FROM haven.leaderboard WHERE id = $1', [rows[0].id])).rejects.toThrow();

    await client.query('DELETE FROM haven.authors');
    await client.query('DELETE FROM haven.leaderboard');
  });
  it('joins authors with name and email onto leaderboard rows in one query', async () => {
    await client.query(
      "INSERT INTO haven.leaderboard (rank, name, url, source_url) VALUES (1, 'Joined', 'https://j.example', 'https://s.example')"
    );
    const [{ id }] = (await client.query("SELECT id FROM haven.leaderboard WHERE name = 'Joined'")).rows;
    await client.query('INSERT INTO haven.authors (name, email, project_id) VALUES ($1, $2, $3), ($4, $5, $3)', ['Zoe', 'zoe@example.com', id, 'Al', 'al@example.com']);
    await client.query("INSERT INTO haven.authors (name, email) VALUES ('Detached', 'detached@example.com')");
    const { rows } = await client.query(`
      SELECT l.id, l.rank, l.name, l.url, l.source_url,
             coalesce(json_agg(jsonb_build_object('name', a.name, 'email', a.email) ORDER BY a.name)
                      FILTER (WHERE a.id IS NOT NULL), '[]') AS authors
      FROM haven.leaderboard l
      LEFT JOIN haven.authors a ON a.project_id = l.id
      GROUP BY l.id
      ORDER BY l.rank, l.name, l.id
    `);
    const joined = rows.find((r) => r.name === 'Joined');
    expect(joined.authors).toEqual([
      { name: 'Al', email: 'al@example.com' },
      { name: 'Zoe', email: 'zoe@example.com' }
    ]);
    await client.query('DELETE FROM haven.authors');
    await client.query('DELETE FROM haven.leaderboard');
  });
});
