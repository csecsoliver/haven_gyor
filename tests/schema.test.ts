import { describe, expect, it } from 'vitest';
import { defaults } from '../src/lib/defaults';
import { mergeContent, overridesSchema, siteSchema } from '../src/lib/schema';

describe('Haven content overrides', () => {
  it('has valid complete local defaults', () => {
    expect(siteSchema.parse(defaults)).toEqual(defaults);
    expect(defaults.tagline[1]).toContain('Győr');
  });
  it('accepts the supplied FAQ-array format and preserves answer links', () => {
    const data = overridesSchema.parse({
      tagline: ['Game jam for teens 13-18', 'Nov 14–15 · Győr'],
      faq: [{ q: 'Parents?', a: [
        { text: 'Contact ' }, { text: 'HQ', href: 'mailto:haven@hackclub.com' }, { text: '!' }
      ] }]
    });
    expect(data.faq).toEqual({ items: [{ q: 'Parents?', a: [
      { text: 'Contact ' }, { text: 'HQ', href: 'mailto:haven@hackclub.com' }, { text: '!' }
    ] }] });
    expect(mergeContent(defaults, data).faq.heading).toBe(defaults.faq.heading);
  });
  it('deep-merges object fields but replaces arrays, including empty arrays', () => {
    const result = mergeContent(defaults, overridesSchema.parse({
      hero: { signup: { button: 'Join us' } },
      faq: { items: [] }, schedule: { days: [] }
    }));
    expect(result.hero.signup.button).toBe('Join us');
    expect(result.hero.signup.placeholder).toBe(defaults.hero.signup.placeholder);
    expect(result.faq.items).toEqual([]);
    expect(result.schedule.days).toEqual([]);
  });
  it('rejects malformed structure, unknown keys, and unsafe URLs', () => {
    for (const input of [
      null, [], { signupUrl: 'https://example.com' }, { tagline: null },
      { faq: [{ q: 'hi', a: [{ text: 'bad', href: 'javascript:alert(1)' }] }] },
      { faq: [{ q: 'hi', a: [{ text: 'bad', href: 'https://example.com/a b' }] }] },
      { sponsors: { items: [{ name: 'x', image: '//evil.example/x', href: 'https://example.com' }] } },
      { schedule: { days: [{ day: 'Saturday', items: [{ title: 'Missing time' }] }] } }
    ]) expect(overridesSchema.safeParse(input).success).toBe(false);
  });
  it('treats HTML as ordinary text, not markup', () => {
    const content = overridesSchema.parse({ faq: [{ q: '<script>x</script>', a: [{ text: '<b>x</b>' }] }] });
    expect(mergeContent(defaults, content).faq.items[0].a[0].text).toBe('<b>x</b>');
  });
});
