export type CollectionGame = {
  bggId: number;
  name: string;
  yearPublished?: number;
  thumbnailUrl?: string;
  minPlayers?: number;
  maxPlayers?: number;
  playingTime?: number;
};

export type BGGCollection = {
  status: 'ready' | 'processing';
  retryAfterSeconds?: number;
  games?: CollectionGame[];
};

export type AnonymousTable = {
  code: string;
  name: string;
  hostToken: string;
  createdAt: string;
};

export type FieldKind = 'checkbox' | 'counter' | 'manual';
export type ScoreField = { id: string; name: string; kind: FieldKind; pointsPerUnit: number };
export type ScoringRule = { id: string; gameName: string; name: string; winCondition: 'highest_total' | 'lowest_total'; fields: ScoreField[]; isPublic: boolean; createdAt: string };
export type CreateScoringRule = Omit<ScoringRule, 'id' | 'createdAt' | 'fields'> & { fields: Omit<ScoreField, 'id'>[] };
export type Player = { id: string; name: string };
export type SessionTotal = { playerId: string; total: number };
export type ScoreSession = { id: string; tableCode: string; ruleId: string; players: Player[]; values: Record<string, Record<string, number>>; status: string; createdAt: string; lastModified: string; totals: SessionTotal[] };

const baseURL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8080';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${baseURL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  });
  const body = (await response.json()) as T & { error?: string };
  if (!response.ok && response.status !== 202) {
    throw new Error(body.error ?? 'Something went wrong.');
  }
  return body;
}

export const api = {
  getCollection: (username: string) => request<BGGCollection>(`/v1/bgg/collections/${encodeURIComponent(username)}`),
  createTable: (name: string) =>
    request<AnonymousTable>('/v1/tables', { method: 'POST', body: JSON.stringify({ name }) }),
  createScoringRule: (rule: CreateScoringRule) => request<ScoringRule>('/v1/scoring-rules', { method: 'POST', body: JSON.stringify(rule) }),
  listScoringRules: () => request<ScoringRule[]>('/v1/scoring-rules'),
  createSession: (tableCode: string, hostToken: string, ruleId: string, players: string[]) => request<ScoreSession>(`/v1/tables/${encodeURIComponent(tableCode)}/sessions`, { method: 'POST', headers: { 'X-Table-Token': hostToken }, body: JSON.stringify({ ruleId, players: players.map((name) => ({ name })) }) }),
  getSession: (sessionId: string) => request<ScoreSession>(`/v1/sessions/${encodeURIComponent(sessionId)}`),
  updateScores: (sessionId: string, values: ScoreSession['values']) => request<ScoreSession>(`/v1/sessions/${encodeURIComponent(sessionId)}/scores`, { method: 'PUT', body: JSON.stringify({ values }) }),
  finishSession: (sessionId: string) => request<ScoreSession>(`/v1/sessions/${encodeURIComponent(sessionId)}/finish`, { method: 'POST' }),
};
