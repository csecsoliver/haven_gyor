import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const prerender = false;
export const load = (() => redirect(308, '/')) satisfies PageServerLoad;
