import type { AttemptRecord } from '../types/twister';

const STORAGE_KEY = 'celc-twister-records';

function readAll(): Record<string, AttemptRecord> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeAll(records: Record<string, AttemptRecord>): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

export function getRecord(twisterId: string): AttemptRecord | null {
  const all = readAll();
  return all[twisterId] ?? null;
}

export function getAllRecords(): Record<string, AttemptRecord> {
  return readAll();
}

/**
 * Saves a new attempt. Only overwrites bestTimeMs if this attempt beat it.
 * Returns true if this attempt set a new personal best.
 */
export function saveAttempt(
  twisterId: string,
  timeMs: number,
  rating?: 1 | 2 | 3 | 4 | 5,
): boolean {
  const all = readAll();
  const existing = all[twisterId];
  const isNewBest = !existing || timeMs < existing.bestTimeMs;

  all[twisterId] = {
    twisterId,
    bestTimeMs: isNewBest ? timeMs : existing.bestTimeMs,
    lastAttemptAt: new Date().toISOString(),
    attemptCount: (existing?.attemptCount ?? 0) + 1,
    ...(rating !== undefined && { lastRating: rating }),
  };

  writeAll(all);
  return isNewBest;
}

export function formatMs(ms: number): string {
  return (ms / 1000).toFixed(2) + 's';
}
