import { z } from 'zod';

const text = z.string().max(20000);
const address = z.string().max(2048).refine((value) => {
  if (/[\s"'<>[\]\\]/u.test(value)) return false;
  try {
    const url = new URL(value);
    return (url.protocol === 'https:' && !!url.hostname && !url.username && !url.password)
      || (url.protocol === 'mailto:' && !!url.pathname);
  } catch { return false; }
}, 'Use a valid https:// or mailto: URL without spaces or quotes');
const image = z.union([
  address.refine((value) => value.startsWith('https:'), 'Images must use HTTPS'),
  z.string().max(2048).regex(/^\/(?!\/)[^\s"'<>[\]\\]*$/u, 'Use a root-relative image path')
]);
const segment = z.strictObject({ text, href: address.optional(), mark: z.boolean().optional() });
const rich = z.array(segment).max(200);
const faqItem = z.strictObject({ q: text, a: rich });
const scheduleItem = z.strictObject({ time: text, title: text, body: text.optional() });
const day = z.strictObject({ day: text, items: z.array(scheduleItem).max(200) });
const photo = z.strictObject({
  src: image, alt: text, href: address.optional(),
  caption: z.strictObject({ title: text, author: text.optional() }).optional()
});
const perk = z.strictObject({
  title: text, side: z.enum(['start', 'end']).optional(),
  blurb: z.array(text).max(100), photos: z.array(photo).max(100)
});
const meta = z.strictObject({ title: text, description: text, image });
const nav = z.strictObject({ signup: text, about: text, faq: text });
const signup = z.strictObject({ placeholder: text, button: text });
const hero = z.strictObject({
  organizeCta: text, mapLabel: text, scrollLabel: text, signup
});
const about = z.strictObject({ title: text, body: text, perks: z.array(perk).max(100) });
const pitch = z.strictObject({
  heading: text,
  items: z.array(z.strictObject({ align: z.enum(['start', 'end', 'center']).optional(), body: rich })).max(100)
});
const cta = z.strictObject({ label: text, href: address });
const steps = z.strictObject({ heading: text, subheading: text, cta });
const tbd = z.strictObject({ title: text, body: text });
const schedule = z.strictObject({ heading: text, tbd, days: z.array(day).max(100) });
const pastEvents = z.strictObject({
  heading: z.array(text).max(20),
  items: z.array(z.strictObject({
    title: text, caption: text, image, alt: text, play: image.optional(),
    href: address, position: text.optional()
  })).max(100)
});
const sponsors = z.strictObject({
  heading: text,
  items: z.array(z.strictObject({ name: text, image, href: address })).max(100)
});
const faq = z.strictObject({ heading: text, cta: text, items: z.array(faqItem).max(200) });
const footerLinks = z.strictObject({ hackClub: text, slack: text, clubs: text, hackathons: text });
const footer = z.strictObject({ body: z.array(rich).max(100), links: footerLinks });
const fonts = z.strictObject({ display: text, body: text });
// Upstream allows named image overrides. These remain inert image URLs, never HTML.
const images = z.record(z.string().max(100), image);

export const siteSchema = z.strictObject({
  meta, nav, tagline: z.array(text).max(20), hero, about, pitch, steps,
  schedule, pastEvents, sponsors, faq, footer, fonts, images
});
export type SiteContent = z.infer<typeof siteSchema>;
export type RichText = z.infer<typeof rich>;

export const overridesSchema = z.strictObject({
  meta: meta.partial().optional(),
  nav: nav.partial().optional(),
  tagline: z.array(text).max(20).optional(),
  hero: hero.omit({ signup: true }).partial().extend({ signup: signup.partial().optional() }).optional(),
  about: about.partial().optional(),
  pitch: pitch.partial().optional(),
  steps: steps.omit({ cta: true }).partial().extend({ cta: cta.partial().optional() }).optional(),
  schedule: schedule.omit({ tbd: true }).partial().extend({ tbd: tbd.partial().optional() }).optional(),
  pastEvents: pastEvents.partial().optional(),
  sponsors: sponsors.partial().optional(),
  faq: z.union([z.array(faqItem).max(200), faq.partial()]).optional(),
  footer: footer.omit({ links: true }).partial().extend({ links: footerLinks.partial().optional() }).optional(),
  fonts: fonts.partial().optional(),
  images: images.optional()
}).transform((value) => ({
  ...value,
  ...(Array.isArray(value.faq) ? { faq: { items: value.faq } } : {})
}));
export type Overrides = z.output<typeof overridesSchema>;

/** Object fields inherit defaults; arrays (including empty ones) replace defaults. */
export function mergeContent(defaults: SiteContent, overrides: Overrides): SiteContent {
  function merge(base: unknown, patch: unknown): unknown {
    if (patch === undefined) return base;
    if (typeof patch !== 'object' || patch === null || Array.isArray(patch)) return patch;
    const result = { ...(base as Record<string, unknown>) };
    for (const [key, value] of Object.entries(patch)) result[key] = merge(result[key], value);
    return result;
  }
  return siteSchema.parse(merge(defaults, overrides));
}
