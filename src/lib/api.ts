import type { DocumentPickerAsset } from 'expo-document-picker';
import { Platform } from 'react-native';

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

export type RulesThread = { id: number; title: string; author: string; posts: number; url: string };
export type GameRules = { status: 'ready' | 'processing'; retryAfterSeconds?: number; forumUrl?: string; totalThreads: number; threads: RulesThread[] };
export type PDFExtract = { fileName: string; pages: number; text: string; scoringExcerpts: string[] };

export type AnonymousTable = {
  code: string;
  name: string;
  hostToken: string;
  createdAt: string;
};

export type FieldKind = 'checkbox' | 'counter' | 'manual';
export type ScoreField = { id: string; name: string; kind: FieldKind; pointsPerUnit: number };
export type ScoringRule = { id: string; bggId?: number; gameName: string; name: string; winCondition: 'highest_total' | 'lowest_total'; fields: ScoreField[]; isPublic: boolean; createdAt: string };
export type CreateScoringRule = Omit<ScoringRule, 'id' | 'createdAt' | 'fields'> & { fields: Omit<ScoreField, 'id'>[] };
export type Player = { id: string; name: string };
export type SessionTotal = { playerId: string; total: number };
export type ScoreSession = { id: string; tableCode: string; ruleId: string; players: Player[]; values: Record<string, Record<string, number>>; manualPoints?: Record<string, number>; status: string; createdAt: string; lastModified: string; totals: SessionTotal[] };
export type ScheduledGame = { id: string; tableCode: string; gameName: string; ruleId?: string; scheduledAt: string; players: string[]; sessionId?: string; createdAt: string };

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
  getGameRules: (gameId: number) => request<GameRules>(`/v1/bgg/games/${gameId}/rules`),
  async extractPDF(asset: DocumentPickerAsset): Promise<PDFExtract> {
    const data = new FormData();
    if (Platform.OS === 'web' && asset.file) data.append('file', asset.file, asset.name);
    else data.append('file', { uri: asset.uri, name: asset.name, type: 'application/pdf' } as unknown as Blob);
    let response: Response;
    try {
      response = await fetch(`${baseURL}/v1/pdf/extract`, { method: 'POST', body: data });
    } catch {
      throw new Error('Could not reach the PDF service. Check that the API is running and your phone is on the same network.');
    }
    const body = await response.json().catch(() => null) as (PDFExtract & { error?: string }) | null;
    if (!response.ok) throw new Error(body?.error ?? `The PDF service returned HTTP ${response.status}.`);
    if (!body || typeof body.text !== 'string' || !Array.isArray(body.scoringExcerpts)) {
      throw new Error('The PDF service returned an invalid response.');
    }
    return body;
  },
  createTable: (name: string) =>
    request<AnonymousTable>('/v1/tables', { method: 'POST', body: JSON.stringify({ name }) }),
  createScoringRule: (rule: CreateScoringRule) => request<ScoringRule>('/v1/scoring-rules', { method: 'POST', body: JSON.stringify(rule) }),
  listScoringRules: () => request<ScoringRule[]>('/v1/scoring-rules'),
  searchCommunityRules: (query: string, bggId?: number) => request<ScoringRule[]>(`/v1/community/scoring-rules?query=${encodeURIComponent(query)}${bggId ? `&bggId=${bggId}` : ''}`),
  createScheduledGame: (tableCode: string, hostToken: string, gameName: string, scheduledAt: string, players: string[], ruleId?: string) => request<ScheduledGame>(`/v1/tables/${encodeURIComponent(tableCode)}/scheduled-games`, { method: 'POST', headers: { 'X-Table-Token': hostToken }, body: JSON.stringify({ gameName, scheduledAt, players, ruleId }) }),
  listScheduledGames: (tableCode: string, hostToken: string) => request<ScheduledGame[]>(`/v1/tables/${encodeURIComponent(tableCode)}/scheduled-games`, { headers: { 'X-Table-Token': hostToken } }),
  setScheduledGameRule: (id: string, hostToken: string, ruleId: string) => request<ScheduledGame>(`/v1/scheduled-games/${encodeURIComponent(id)}/rule`, { method: 'PATCH', headers: { 'X-Table-Token': hostToken }, body: JSON.stringify({ ruleId }) }),
  setScheduledGameSession: (id: string, hostToken: string, sessionId: string) => request<ScheduledGame>(`/v1/scheduled-games/${encodeURIComponent(id)}/session`, { method: 'PATCH', headers: { 'X-Table-Token': hostToken }, body: JSON.stringify({ sessionId }) }),
  createSession: (tableCode: string, hostToken: string, ruleId: string, players: string[]) => request<ScoreSession>(`/v1/tables/${encodeURIComponent(tableCode)}/sessions`, { method: 'POST', headers: { 'X-Table-Token': hostToken }, body: JSON.stringify({ ruleId, players: players.map((name) => ({ name })) }) }),
  getSession: (sessionId: string) => request<ScoreSession>(`/v1/sessions/${encodeURIComponent(sessionId)}`),
  addPlayer: (sessionId: string, name: string) => request<ScoreSession>(`/v1/sessions/${encodeURIComponent(sessionId)}/players`, { method: 'POST', body: JSON.stringify({ name }) }),
  updateScores: (sessionId: string, values: ScoreSession['values']) => request<ScoreSession>(`/v1/sessions/${encodeURIComponent(sessionId)}/scores`, { method: 'PUT', body: JSON.stringify({ values }) }),
  setScore: (sessionId: string, playerId: string, fieldId: string, value: number) => request<ScoreSession>(`/v1/sessions/${encodeURIComponent(sessionId)}/scores`, { method: 'PATCH', body: JSON.stringify({ playerId, fieldId, value }) }),
  adjustPoints: (sessionId: string, playerId: string, delta: number) => request<ScoreSession>(`/v1/sessions/${encodeURIComponent(sessionId)}/points`, { method: 'POST', body: JSON.stringify({ playerId, delta }) }),
  finishSession: (sessionId: string) => request<ScoreSession>(`/v1/sessions/${encodeURIComponent(sessionId)}/finish`, { method: 'POST' }),
  reopenSession: (sessionId: string, hostToken: string) => request<ScoreSession>(`/v1/sessions/${encodeURIComponent(sessionId)}/reopen`, { method: 'POST', headers: { 'X-Table-Token': hostToken } }),
};
