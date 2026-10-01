import { readFile } from 'node:fs/promises';
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
    const sql = await readFile('db/001_content.sql', 'utf8');
    if (managed) await managed.query(sql);
    else await memory!.exec(sql);
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
});
