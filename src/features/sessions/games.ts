// Pure listing of the person's games for the Partidas tab: no React or Expo
// imports, so tests can load it.
import type { AccountGameSession, AnonymousTable, ScoreSession, ScoringRule } from '@/lib/api';

type Status = ScoreSession['status'] | 'waiting';

export type GameEntry = {
  id: string;
  gameName: string;
  status: Status;
  playerCount: number;
  tableCode: string;
  /** This device created the table, so it can pause, finish or invite. */
  isHost: boolean;
  /** The person's player in an account game, to open it as them. */
  playerId?: string;
  finishedAt?: string;
  winnerNames: string[];
  updatedAt: string;
};

type Sources = {
  tables: AnonymousTable[];
  tableSessions: Record<string, ScoreSession>;
  current: ScoreSession | null;
  guest: ScoreSession | null;
  account: AccountGameSession[];
  rules: ScoringRule[];
};

const statusOrder: Record<string, number> = { active: 0, waiting: 1, paused: 2, finished: 3 };

/** Ongoing games first (active, waiting, paused), then finished ones, newest first. */
export function listGames({ tables, tableSessions, current, guest, account, rules }: Sources): { ongoing: GameEntry[]; finished: GameEntry[] } {
  const hostCodes = new Set(tables.map((table) => table.code.toUpperCase()));
  const byId = new Map<string, GameEntry>();
  const add = (session: ScoreSession, gameName?: string, playerId?: string) => {
    const existing = byId.get(session.id);
    if (existing && existing.updatedAt >= session.lastModified) {
      if (playerId && !existing.playerId) existing.playerId = playerId;
      return;
    }
    const rule = (session as ScoreSession & { rule?: ScoringRule }).rule;
    byId.set(session.id, {
      id: session.id,
      gameName: gameName ?? rule?.gameName ?? rules.find((item) => item.id === session.ruleId)?.gameName ?? 'Partida',
      status: session.status,
      playerCount: session.players.length,
      tableCode: session.tableCode,
      isHost: hostCodes.has(session.tableCode.toUpperCase()),
      playerId: playerId ?? existing?.playerId,
      finishedAt: session.finishedAt,
      winnerNames: (session.winners ?? []).map((winner) => session.players.find((player) => player.id === winner.playerId)?.name ?? 'Jugador'),
      updatedAt: session.lastModified,
    });
  };
  Object.values(tableSessions).forEach((session) => add(session));
  if (current) add(current);
  if (guest) add(guest);
  account.forEach((session) => add(session, session.gameName, session.myPlayerId));

  const entries = [...byId.values()];
  const newest = (a: GameEntry, b: GameEntry) => (b.finishedAt ?? b.updatedAt).localeCompare(a.finishedAt ?? a.updatedAt);
  return {
    ongoing: entries.filter((entry) => entry.status !== 'finished').sort((a, b) => statusOrder[a.status] - statusOrder[b.status] || newest(a, b)),
    finished: entries.filter((entry) => entry.status === 'finished').sort(newest),
  };
}

export function describeGame(entry: GameEntry): string {
  const players = `${entry.playerCount} ${entry.playerCount === 1 ? 'jugador' : 'jugadores'}`;
  if (entry.status === 'waiting') return `Esperando jugadores · código ${entry.tableCode}`;
  if (entry.status === 'paused') return `Pausada · ${players}`;
  if (entry.status === 'active') return `En curso · ${players}`;
  const winner = entry.winnerNames.length === 1 ? `Ganó ${entry.winnerNames[0]}` : entry.winnerNames.length ? `Empate: ${entry.winnerNames.join(', ')}` : 'Terminada';
  return `${winner} · ${players}`;
}
