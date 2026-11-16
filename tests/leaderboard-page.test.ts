import { expect, it } from 'vitest';
import { render } from 'svelte/server';
import Page from '../src/routes/+page.svelte';

const leaderboard = [
  { id: '11111111-1111-4111-8111-111111111111', rank: 1, name: 'Alpha', url: 'https://alpha.example', source_url: 'https://github.com/example/alpha', authors: [{ name: 'Ada', email: 'ada@example.com' }, { name: 'Cleo', email: 'cleo@example.com' }] },
  { id: '22222222-2222-4222-8222-222222222222', rank: 2, name: 'Beta <script>alert(1)</script>', url: 'javascript:alert(1)', source_url: 'https://github.com/example/beta', authors: [] },
  { id: '33333333-3333-4333-8333-333333333333', rank: 3, name: '', url: '', source_url: '', authors: [{ name: 'No Email', email: '' }] }
];

it('renders every leaderboard row with rank, name, authors, link, and source', () => {
  const { body } = render(Page, { props: { data: { leaderboard } } });
  expect(body).toContain('Leaderboard');
  expect(body).toMatch(/<td class="rank[^"]*">1<\/td>/);
  expect(body).toMatch(/<td class="rank[^"]*">2<\/td>/);
  expect(body).toContain('Alpha');
  expect(body).toContain('Ada');
  expect(body).toContain('Cleo');
  expect(body).toContain('href="mailto:ada@example.com"');
  expect(body).toContain('href="https://alpha.example"');
  expect(body).toContain('href="https://github.com/example/alpha"');
  expect(body).toContain('href="https://github.com/example/beta"');
  expect(body).toContain('rel="noopener noreferrer"');
});

it('shows a placeholder for projects without authors', () => {
  const { body } = render(Page, { props: { data: { leaderboard } } });
  const html = body.replace(/<!--.*?-->/gs, '');
  expect(html).toMatch(/<td class="authors[^"]*">—<\/td>/);
});

it('renders empty fields as placeholders, never as empty cells or links', () => {
  const { body } = render(Page, { props: { data: { leaderboard } } });
  const html = body.replace(/<!--.*?-->/gs, '');
  expect(html).not.toContain('href=""');
  expect(html).not.toContain('href="mailto:"');
  expect(html).toMatch(/<td class="name[^"]*">—<\/td>/);
  expect(html.match(/<td class="link[^"]*">—<\/td>/g)).toHaveLength(2);
  // The author with an empty email still shows their name, without a link.
  expect(html).toContain('No Email');
  expect(html).not.toContain('No Email <a');
});

it('escapes names and never turns unsafe URLs into links', () => {
  const { body } = render(Page, { props: { data: { leaderboard } } });
  expect(body).toContain('Beta &lt;script>alert(1)&lt;/script>');
  expect(body).not.toContain('href="javascript:');
});

it('keeps the site layout shell around the leaderboard', () => {
  const { body } = render(Page, { props: { data: { leaderboard } } });
  expect(body).toContain('landing-hero');
  expect(body).toContain('site-footer');
  expect(body).toContain('Looking for the official website?');
});

it('shows an empty state when the leaderboard has no rows', () => {
  const { body } = render(Page, { props: { data: { leaderboard: [] } } });
  expect(body).toContain('No projects on the leaderboard yet.');
});
