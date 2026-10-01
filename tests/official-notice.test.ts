import { expect, it } from 'vitest';
import { render } from 'svelte/server';
import Page from '../src/routes/+page.svelte';
import { defaults } from '../src/lib/defaults';

it('shows a dismissible notice linking to the official website', () => {
  const { body } = render(Page, { props: { data: { content: defaults } } });
  expect(body).toContain('Looking for the official website?');
  expect(body).toContain('href="https://haven.hackclub.com"');
  expect(body).toContain('aria-label="Dismiss official website notice"');
});
