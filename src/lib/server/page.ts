import { error } from '@sveltejs/kit';
import { loadContent } from './db';

export async function loadPage(setHeaders: (headers: Record<string, string>) => void) {
  setHeaders({ 'cache-control': 'no-store' });
  try {
    return { content: await loadContent() };
  } catch (cause) {
    console.error('Could not load Haven content:', cause);
    error(503, 'Event information is temporarily unavailable. Please try again shortly.');
  }
}
