import { expect, it, vi } from 'vitest';
import { loadPage } from '../src/lib/server/page';
import { importContent } from '../src/lib/server/db';
import { defaults } from '../src/lib/defaults';

const { query } = vi.hoisted(() => ({ query: vi.fn() }));
vi.mock('$env/dynamic/private', () => ({ env: { DATABASE_URL: 'postgresql://test' } }));
vi.mock('pg', () => ({ default: { Pool: class { query = query; } } }));

const entries = [
  { id: '11111111-1111-4111-8111-111111111111', rank: 1, name: 'Alpha', url: 'https://alpha.example', source_url: 'https://github.com/example/alpha', authors: [{ name: 'Ada', email: 'ada@example.com' }, { name: 'Cleo', email: 'cleo@example.com' }] },
  { id: '22222222-2222-4222-8222-222222222222', rank: 2, name: 'Beta', url: 'https://beta.example', source_url: 'https://github.com/example/beta', authors: [] }
];

it('queries the leaderboard table on every page load and never serves cached content on failure', async () => {
  const setHeaders = vi.fn();
  query.mockResolvedValueOnce({ rows: [entries[0]] });
  expect((await loadPage(setHeaders)).leaderboard).toEqual([entries[0]]);
  query.mockResolvedValueOnce({ rows: [entries[1]] });
  expect((await loadPage(setHeaders)).leaderboard).toEqual([entries[1]]);
  query.mockRejectedValueOnce(new Error('Database unavailable'));
  const log = vi.spyOn(console, 'error').mockImplementation(() => {});
  try {
    await expect(loadPage(setHeaders)).rejects.toMatchObject({ status: 503 });
  } finally {
    log.mockRestore();
  }
  expect(query).toHaveBeenCalledTimes(3);
  expect(query).toHaveBeenNthCalledWith(1, expect.stringMatching(/SELECT l\.id, l\.rank, l\.name, l\.url, l\.source_url,[\s\S]*FROM haven\.leaderboard l[\s\S]*LEFT JOIN haven\.authors a ON a\.project_id = l\.id[\s\S]*ORDER BY l\.rank, l\.name, l\.id/));
  expect(setHeaders.mock.calls).toEqual(Array(3).fill([{ 'cache-control': 'no-store' }]));
});

it('rejects malformed leaderboard rows instead of serving them', async () => {
  query.mockResolvedValueOnce({ rows: [{ id: 'not-a-uuid', rank: 1, name: 'Bad id', url: 'https://x.example', source_url: 'https://x.example', authors: [] }] });
  const log2 = vi.spyOn(console, 'error').mockImplementation(() => {});
  try {
    await expect(loadPage(vi.fn())).rejects.toMatchObject({ status: 503 });
  } finally {
    log2.mockRestore();
  }
  query.mockResolvedValueOnce({ rows: [{ id: '11111111-1111-4111-8111-111111111111', rank: 1, name: 'Missing source', url: 'https://x.example', authors: [] }] });
  const log3 = vi.spyOn(console, 'error').mockImplementation(() => {});
  try {
    await expect(loadPage(vi.fn())).rejects.toMatchObject({ status: 503 });
  } finally {
    log3.mockRestore();
  }
  // An author with a malformed email must not be served either.
  query.mockResolvedValueOnce({ rows: [{ id: '11111111-1111-4111-8111-111111111111', rank: 1, name: 'Ok', url: 'https://x.example', source_url: 'https://x.example', authors: [{ name: 'Bad', email: 'not an email' }] }] });
  const log = vi.spyOn(console, 'error').mockImplementation(() => {});
  try {
    await expect(loadPage(vi.fn())).rejects.toMatchObject({ status: 503 });
  } finally {
    log.mockRestore();
  }
});

it('serves rows with empty string fields instead of failing the page', async () => {
  const row = { id: '33333333-3333-4333-8333-333333333333', rank: 3, name: '', url: '', source_url: '', authors: [{ name: 'No Email', email: '' }] };
  query.mockResolvedValueOnce({ rows: [row] });
  expect((await loadPage(vi.fn())).leaderboard).toEqual([row]);
});

it('still stores full defaults on content import for the admin API', async () => {
  query.mockResolvedValueOnce({ rows: [] });
  await importContent({ tagline: ['Custom'], faq: { items: [] } });
  expect(query).toHaveBeenLastCalledWith('SELECT haven.import_content($1::jsonb)', [
    JSON.stringify({ ...defaults, tagline: ['Custom'], faq: { ...defaults.faq, items: [] } })
  ]);
});
