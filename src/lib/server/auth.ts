import { timingSafeEqual } from 'node:crypto';
import { env } from '$env/dynamic/private';
import { error } from '@sveltejs/kit';

export function requireAdmin(request: Request) {
  if (!env.ADMIN_TOKEN || env.ADMIN_TOKEN.length < 32) {
    error(503, 'Admin access is disabled. Configure an ADMIN_TOKEN of at least 32 characters.');
  }
  const header = request.headers.get('authorization') ?? '';
  const expected = Buffer.from(`Bearer ${env.ADMIN_TOKEN}`);
  const actual = Buffer.from(header);
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) {
    error(401, 'A valid admin bearer token is required.');
  }
}
