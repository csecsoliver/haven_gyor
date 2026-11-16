import { expect, it } from 'vitest';
import { render } from 'svelte/server';
import Page from '../src/routes/+page.svelte';

const leaderboard = [
  { id: '11111111-1111-4111-8111-111111111111', rank: 1, name: 'Alpha', url: 'https://alpha.example', source_url: 'https://github.com/example/alpha', authors: [{ name: 'Ada', email: 'ada@example.com' }, { name: 'Cleo', email: 'cleo@example.com' }] },
  { id: '22222222-2222-4222-8222-222222222222', rank: 2, name: 'Beta <script>alert(1)</script>', url: 'javascript:alert(1)', source_url: 'https://github.com/example/beta', authors: [] },
  { id: '33333333-3333-4333-8333-333333333333', rank: 3, name: 'Gamma', url: 'https://gamma.example', source_url: 'https://github.com/example/gamma', authors: [] },
  { id: '44444444-4444-4444-8444-444444444444', rank: 4, name: 'Delta', url: 'https://delta.example', source_url: 'https://github.com/example/delta', authors: [{ name: 'No Email', email: '' }] },
  { id: '55555555-5555-4555-8555-555555555555', rank: 5, name: '', url: '', source_url: '', authors: [] }
];

// Svelte SSR wraps dynamic text in comment markers; strip them for assertions.
const strip = (html: string) => html.replace(/<!--.*?-->/gs, '');

it('renders each entry as a card', () => {
  const { body } = render(Page, { props: { data: { leaderboard } } });
  const html = strip(body);
  expect(html.match(/<article class="card[^"]*">/g)).toHaveLength(5);
  expect(html).toContain('Alpha');
  expect(html).toContain('Delta');
});

it('shows the placing only for the top three entries', () => {
  const { body } = render(Page, { props: { data: { leaderboard } } });
  const html = strip(body);
  expect(html).toContain('>1st<');
  expect(html).toContain('>2nd<');
  expect(html).toContain('>3rd<');
  expect(html).not.toContain('4th');
  expect(html).not.toContain('5th');
  expect(html.match(/class="placing[^"]*"/g)).toHaveLength(3);
});

it('renders authors, safe links, and mailto emails', () => {
  const { body } = render(Page, { props: { data: { leaderboard } } });
  const html = strip(body);
  expect(html).toContain('Ada');
  expect(html).toContain('Cleo');
  expect(html).toContain('href="mailto:ada@example.com"');
  expect(html).toContain('href="https://alpha.example"');
  expect(html).toContain('href="https://github.com/example/alpha"');
  expect(html).toContain('href="https://github.com/example/beta"');
  expect(html).toContain('rel="noopener noreferrer"');
});

it('escapes names and never turns unsafe URLs into links', () => {
  const { body } = render(Page, { props: { data: { leaderboard } } });
  const html = strip(body);
  expect(html).toContain('Beta &lt;script>alert(1)&lt;/script>');
  expect(html).not.toContain('href="javascript:');
});

it('renders empty fields as placeholders, never as empty cells or links', () => {
  const { body } = render(Page, { props: { data: { leaderboard } } });
  const html = strip(body);
  expect(html).not.toContain('href=""');
  expect(html).not.toContain('href="mailto:"');
  expect(html).toMatch(/<h3 class="name[^"]*">—<\/h3>/);
  // The rank-4 author with an empty email still shows their name, without a link.
  expect(html).toContain('No Email');
  expect(html).not.toContain('No Email <a');
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
