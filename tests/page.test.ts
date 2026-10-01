import { expect, it, vi } from 'vitest';
import { loadPage } from '../src/lib/server/page';
import { defaults } from '../src/lib/defaults';
import { importContent } from '../src/lib/server/db';

const { query } = vi.hoisted(() => ({ query: vi.fn() }));
vi.mock('$env/dynamic/private', () => ({ env: { DATABASE_URL: 'postgresql://test' } }));
vi.mock('pg', () => ({ default: { Pool: class { query = query; } } }));

it('queries the database on every page load and never serves cached content on failure', async () => {
  const setHeaders = vi.fn();
  query.mockResolvedValueOnce({ rows: [{ content: { ...defaults, tagline: ['First'] } }] });
  expect((await loadPage(setHeaders)).content.tagline).toEqual(['First']);
  query.mockResolvedValueOnce({ rows: [{ content: { ...defaults, tagline: ['Updated'] } }] });
  expect((await loadPage(setHeaders)).content.tagline).toEqual(['Updated']);
  query.mockRejectedValueOnce(new Error('Database unavailable'));
  const log = vi.spyOn(console, 'error').mockImplementation(() => {});
  try {
    await expect(loadPage(setHeaders)).rejects.toMatchObject({ status: 503 });
  } finally {
    log.mockRestore();
  }
  expect(query).toHaveBeenCalledTimes(3);
  expect(query).toHaveBeenNthCalledWith(1, 'SELECT haven.export_content() AS content');
  expect(setHeaders.mock.calls).toEqual(Array(3).fill([{ 'cache-control': 'no-store' }]));
});

it('stores full defaults on import and never fills incomplete database reads locally', async () => {
  query.mockResolvedValueOnce({ rows: [] });
  await importContent({ tagline: ['Custom'], faq: { items: [] } });
  expect(query).toHaveBeenLastCalledWith('SELECT haven.import_content($1::jsonb)', [
    JSON.stringify({ ...defaults, tagline: ['Custom'], faq: { ...defaults.faq, items: [] } })
  ]);
  query.mockResolvedValueOnce({ rows: [{ content: { tagline: ['Incomplete'] } }] });
  const log = vi.spyOn(console, 'error').mockImplementation(() => {});
  try {
    await expect(loadPage(vi.fn())).rejects.toMatchObject({ status: 503 });
  } finally {
    log.mockRestore();
  }
});
