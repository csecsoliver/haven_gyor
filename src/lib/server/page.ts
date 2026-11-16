import { error } from '@sveltejs/kit';
import { loadLeaderboard } from './db';
import type { LeaderboardEntry } from '$lib/schema';

// The top three keep their rank order (and their placing badge); everything
// below is shuffled on every load.
const PODIUM_SIZE = 3;

function orderLeaderboard(entries: LeaderboardEntry[]): LeaderboardEntry[] {
  const podium = entries
    .filter((entry) => entry.rank <= PODIUM_SIZE)
    .sort((a, b) => a.rank - b.rank);
  const rest = entries.filter((entry) => entry.rank > PODIUM_SIZE);
  for (let i = rest.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [rest[i], rest[j]] = [rest[j], rest[i]];
  }
  return [...podium, ...rest];
}

export async function loadPage(setHeaders: (headers: Record<string, string>) => void) {
  setHeaders({ 'cache-control': 'no-store' });
  try {
    return { leaderboard: orderLeaderboard(await loadLeaderboard()) };
  } catch (cause) {
    console.error('Could not load the leaderboard:', cause);
    error(503, 'The leaderboard is temporarily unavailable. Please try again shortly.');
  }
}
