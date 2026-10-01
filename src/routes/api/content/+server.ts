import { error, json } from '@sveltejs/kit';
import { requireAdmin } from '$lib/server/auth';
import { exportContent, importContent } from '$lib/server/db';
import { overridesSchema } from '$lib/schema';
import type { RequestHandler } from './$types';

const MAX_BYTES = 1_048_576;
const headers = { 'cache-control': 'no-store' };

export const GET: RequestHandler = async ({ request }) => {
  requireAdmin(request);
  try {
    const content = await exportContent();
    return new Response(JSON.stringify(content, null, 2) + '\n', {
      headers: {
        ...headers, 'content-type': 'application/json; charset=utf-8',
        'content-disposition': 'attachment; filename="haven-gyor.json"'
      }
    });
  } catch (cause) {
    console.error('Content export failed:', cause);
    error(503, 'Could not export content. Check the database connection and migrations.');
  }
};

export const PUT: RequestHandler = async ({ request }) => {
  requireAdmin(request);
  if (!request.headers.get('content-type')?.split(';')[0].trim().match(/^application\/json$/i)) {
    error(415, 'Send application/json.');
  }
  const reader = request.body?.getReader();
  if (!reader) error(400, 'A JSON document is required.');
  let bytes = 0;
  const chunks: Uint8Array[] = [];
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    bytes += value.byteLength;
    if (bytes > MAX_BYTES) {
      await reader.cancel();
      error(413, 'JSON must be at most 1 MiB.');
    }
    chunks.push(value);
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch { error(400, 'Invalid JSON. Check quotes, commas, and brackets.'); }
  const result = overridesSchema.safeParse(parsed);
  if (!result.success) {
    return json({
      error: result.error.issues.map((issue) => `${issue.path.join('.') || 'document'}: ${issue.message}`).join('\n')
    }, { status: 400, headers });
  }
  try {
    await importContent(result.data);
    return json({ ok: true }, { headers });
  } catch (cause) {
    console.error('Content import failed:', cause);
    error(503, 'Import failed; the previous content was retained. Check the database connection and migrations.');
  }
};
