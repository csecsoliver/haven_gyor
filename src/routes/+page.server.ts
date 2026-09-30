import { loadPage } from '$lib/server/page';
import type { PageServerLoad } from './$types';

export const prerender = false;
export const load = (({ setHeaders }) => loadPage(setHeaders)) satisfies PageServerLoad;
