import { useEffect, useState } from 'react';

import type { ScoreSession } from '@/lib/api';

/**
 * Played time, ticking while the game is active. Remount the caller with a key
 * of the session's id, lastModified and status so each update starts fresh.
 */
export function useLiveDuration(session: ScoreSession): string {
  const [extra, setExtra] = useState(0);
  useEffect(() => {
    if (session.status !== 'active') return;
    const started = Date.now();
    const timer = setInterval(() => setExtra(Math.floor((Date.now() - started) / 1000)), 1000);
    return () => clearInterval(timer);
  }, [session.id, session.lastModified, session.status]);
  const total = Math.max(0, (session.durationSeconds ?? session.playedSeconds ?? 0) + extra);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  return hours ? `${hours} h ${minutes} min` : `${minutes} min ${String(seconds).padStart(2, '0')} s`;
}
