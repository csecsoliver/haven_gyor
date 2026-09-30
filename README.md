# Independent Haven Győr

A small SvelteKit / PostgreSQL website inspired by [Haven Győr](https://haven.hackclub.com/gyor).
The original white Hack Club Haven wordmark and Győr name are retained, but prominent notices identify this
as an **independently maintained site, not run by Hack Club HQ**.
Every signup button goes to **https://haven.hack.club/150**, explicitly labeled
as a referral link. This app does not collect signup emails.

## Run with managed PostgreSQL

Use Node 22.18+ and an existing managed PostgreSQL database (PostgreSQL 14+).
No local PostgreSQL server or Docker is required.

```sh
npm install
cp .env.example .env
# Edit .env locally: DATABASE_URL, ADMIN_TOKEN, ORIGIN.
npm run db:migrate
npm run dev
```

The ignored `.env` file is private configuration: never commit it or paste
credentials into a shared conversation. Generate `ADMIN_TOKEN` with
`openssl rand -hex 32`. Import/export access is disabled when the token is
missing or shorter than 32 characters.

Use the managed provider's verified TLS connection URL/settings. Prefer
`sslmode=verify-full` when supported. Do not disable certificate verification.
If your provider uses a private CA, supply its certificate through the Node
runtime's `NODE_EXTRA_CA_CERTS` environment variable.

The migration uses a transaction and an advisory lock and is safe to rerun.
It creates only the `haven` schema, its tables, and two functions; existing
content is retained. The migration role must be able to create schemas/tables/
functions. The same role may be used to run this small application.
For a separate application role, grant `USAGE` on schema `haven`, `SELECT`
on its tables, `INSERT, UPDATE, DELETE` on its tables, and `EXECUTE` on
`haven.import_content(jsonb)` and `haven.export_content()`. Functions use
invoker privileges, not `SECURITY DEFINER`. No privileges are granted to PUBLIC.

The public route `/` performs a fresh database query on **every
page request**, including SvelteKit client navigations. `/gyor` permanently
redirects to `/`. No prerendering,
in-memory content cache, browser page cache, or static fallback is used.
Only database connections are pooled. Database failures return a 503 instead
of showing stale information. Configure any reverse proxy/CDN to honor
`Cache-Control: no-store`.

## Import and export

Open `/admin`, enter the token, and paste/upload JSON. The token stays only
in page memory, not local storage or a cookie. Export first if you want a
backup before replacing content.

- Supports the documented [SITE_DATA](https://github.com/hackclub/haven/blob/main/SITE_DATA.md)
  content fields, plus the FAQ array format supplied for this project.
- `faq: [...]` is normalized to `faq: { "items": [...] }` in exports.
- Import **replaces** all overrides atomically; it is not a patch.
- Omitted object fields inherit locally versioned defaults; arrays replace
  defaults, and `[]` deliberately clears items.
- An empty document `{}` resets all fields to local defaults.
- Default schedule/sponsors are empty rather than claiming unconfirmed times
  or placeholder sponsorships.
- The supplied Győr tagline and all ten supplied FAQ entries are the local
  defaults, so the initial empty database already displays them.
- The independent-site notice, city identity, and signup URL cannot be
  changed by importing JSON.
- No raw HTML rendering. Links must use HTTPS or `mailto:`; image URLs use
  HTTPS or a root-relative path. Root-relative Haven images resolve to the
  original Haven origin. Unknown fields and malformed data return errors.
- Typography settings and original artwork are presentation hints; this
  simplified implementation does not recreate every original animation/form.
- Maximum import size: 1 MiB.

API equivalents (set `ADMIN_TOKEN` locally, without putting it in shell history):

```sh
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
  http://localhost:5173/api/content -o haven-gyor.json

curl -X PUT -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" --data-binary @haven-gyor.json \
  http://localhost:5173/api/content

# Export the complete displayed document, including defaults:
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
  'http://localhost:5173/api/content?resolved=1' -o haven-gyor-resolved.json
```

## Storage design

`haven.import_content(jsonb)` and `haven.export_content()` are PL/pgSQL
functions. A site-row lock serializes whole-document imports. FAQ entries,
ordered rich-text segments, schedule days, and schedule items use relational
tables with primary keys and cascading foreign keys. Flexible presentation
sections use JSONB in a section table with a constrained set of section names.
Exports reconstruct ordered children in a single consistent database snapshot.
Explicit empty collections and omitted collections remain distinguishable.

The HTTP boundary validates the complete supported schema before import,
and again on database reads. The SQL function enforces root/section types,
FAQ/schedule child structure, foreign keys, and atomic rollback; direct SQL
callers must still use the documented content schema, rather than bypassing
HTTP validation with arbitrary nested presentation data.

## Build and verify

```sh
npm run check
npm test
npm run build
# Production: set real environment variables or load the ignored .env locally.
node --env-file-if-exists=.env build
```

Serve production over HTTPS. Set `ORIGIN` to your public origin and keep the
admin token secret. The application depends on original Haven images and
Hack Club assets served remotely; their availability is outside this app.
Jua and Haven's extended Jua subset are served locally, and the entire city
name uses Jua so Hungarian `ő` matches the other letters. Their SIL Open Font
License is included in `static/fonts/OFL.txt`.
Upstream FAQ content is retained as requested: “we” in quoted answers refers
to the original Haven organizers, not this site's independent maintainer.
Confirm the date/year and local arrangements before promoting the event.

Optional database integration tests:

```sh
TEST_DATABASE_URL='postgresql://…/disposable_haven_test' npm test
```

**Only use a disposable test database.** These tests migrate the schema and
replace its site content. Never point `TEST_DATABASE_URL` at production.
Without it, database tests run against an isolated in-memory PostgreSQL engine
(PGlite), including the actual PL/pgSQL functions. No PostgreSQL service is needed.
