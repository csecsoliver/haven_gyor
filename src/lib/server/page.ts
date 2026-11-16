import { error } from '@sveltejs/kit';
import { loadLeaderboard } from './db';

export async function loadPage(setHeaders: (headers: Record<string, string>) => void) {
  setHeaders({ 'cache-control': 'no-store' });
  try {
    return { leaderboard: await loadLeaderboard() };
  } catch (cause) {
    console.error('Could not load the leaderboard:', cause);
    error(503, 'The leaderboard is temporarily unavailable. Please try again shortly.');
  }
}
