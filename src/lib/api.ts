import type { DocumentPickerAsset } from 'expo-document-picker';
import type { ImagePickerAsset } from 'expo-image-picker';
import { fetch as expoFetch } from 'expo/fetch';
import { File, Paths } from 'expo-file-system';
import { Platform } from 'react-native';

import { APIRequestError, apiErrorMessage, baseURL, getAuthToken, request } from '@/shared/api/client';

export { APIRequestError, baseURL, setAuthToken } from '@/shared/api/client';

export type CollectionGame = {
  bggId: number;
  name: string;
  yearPublished?: number;
  thumbnailUrl?: string;
  imageUrl?: string;
  minPlayers?: number;
  maxPlayers?: number;
  playingTime?: number;
};

export type BGGCollection = {
  status: 'ready' | 'processing';
  retryAfterSeconds?: number;
  games?: CollectionGame[];
};
export type BGGSearch = BGGCollection;
export type GameDiscovery = {
  status: 'ready' | 'processing';
  retryAfterSeconds?: number;
  games: CollectionGame[];
  communityRules: ScoringRule[];
  rulebooks: Rulebook[];
  cachedRulebooks: boolean;
  unavailableSources: ('bgg' | 'community' | 'rulebooks')[];
  /** Catalog title searched instead of a misspelled query. */
  searchedAs?: string;
  /** AI suggestion when nothing matched; only searched if the person taps it. */
  suggestedQuery?: string;
};

export type APIHealth = { status: 'ok' };

export type RulesThread = { id: number; title: string; author: string; posts: number; url: string };
export type GameRules = { status: 'ready' | 'processing'; retryAfterSeconds?: number; forumUrl?: string; totalThreads: number; threads: RulesThread[] };
export type ScoringSuggestion = { gameName: string; fields: { name: string; kind: FieldKind; pointsPerUnit: number }[]; notes: string[]; source?: 'ai' };
export type Rulebook = { id: string; source: string; sourceId: string; name: string; language: 'en' | 'fr'; edition?: string; pdfUrl: string; bggId?: number; createdAt: string; updatedAt: string };
export type RulebookSearch = { results: Rulebook[]; cached: boolean };
export type PDFExtract = { fileName: string; pages: number; text: string; scoringExcerpts: string[]; scoringSuggestion?: ScoringSuggestion; rulebook?: Rulebook };

export type AnonymousTable = {
  code: string;
  name: string;
  hostToken: string;
  createdAt: string;
};

export type FieldKind = 'checkbox' | 'counter' | 'manual';
export type ScoreField = { id: string; name: string; kind: FieldKind; pointsPerUnit: number };
export type ScoringRule = { id: string; bggId?: number; rulebookId?: string; gameName: string; name: string; winCondition: 'highest_total' | 'lowest_total'; fields: ScoreField[]; isPublic: boolean; createdAt: string };
export type CreateScoringRule = Omit<ScoringRule, 'id' | 'createdAt' | 'fields'> & { fields: Omit<ScoreField, 'id'>[] };
export type Player = { id: string; name: string };
export type SessionTotal = { playerId: string; total: number };
export type ScoreSession = { id: string; tableCode: string; ruleId: string; players: Player[]; values: Record<string, Record<string, number>>; manualPoints?: Record<string, number>; status: 'active' | 'paused' | 'finished'; playedSeconds: number; durationSeconds: number; runningSince?: string; pausedAt?: string; boardPhotoUpdatedAt?: string; createdAt: string; lastModified: string; finishedAt?: string; totals: SessionTotal[]; winners: SessionTotal[] };
export type ScheduledGame = { id: string; tableCode: string; gameName: string; ruleId?: string; scheduledAt: string; players: string[]; sessionId?: string; createdAt: string };
export type AccountUser = { id: string; username: string; createdAt: string };
export type AuthSession = { user: AccountUser; token: string };
export type AccountStats = { finishedGames: number; wins: number; ties: number; totalPoints: number };
export type AccountGameSession = ScoreSession & { gameName: string; myPlayerId: string };

export const api = {
  searchDiscovery: (query: string) => request<GameDiscovery>(`/v1/discovery/search?query=${encodeURIComponent(query.trim())}`),
  searchRulebooks: (query: string, language: 'en' | 'fr' = 'en') => request<RulebookSearch>(`/v1/rulebooks?query=${encodeURIComponent(query.trim())}&language=${language}`),
  extractRulebook: (id: string) => request<PDFExtract>(`/v1/rulebooks/${encodeURIComponent(id)}/extract`, { method: 'POST' }),
  getHealth: () => request<APIHealth>('/health'),
  signUp: (username: string, password: string) => request<AuthSession>('/v1/auth/signup', { method: 'POST', body: JSON.stringify({ username, password }) }),
  logIn: (username: string, password: string) => request<AuthSession>('/v1/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) }),
  logOut: () => request<{ status: 'ok' }>('/v1/auth/logout', { method: 'POST' }),
  getMe: () => request<AccountUser>('/v1/me'),
  getMyStats: () => request<AccountStats>('/v1/me/stats'),
  getMySessions: () => request<AccountGameSession[]>('/v1/me/sessions'),
  getMyTables: () => request<AnonymousTable[]>('/v1/me/tables'),
  claimTable: (code: string, hostToken: string) => request<AnonymousTable>('/v1/me/claim-table', { method: 'POST', body: JSON.stringify({ code, hostToken }) }),
  async getMyAvatar(): Promise<string | null> {
    if (!getAuthToken()) return null;
    const downloadFetch = Platform.OS === 'web' ? fetch : expoFetch;
    const response = await downloadFetch(`${baseURL}/v1/me/avatar`, { headers: { Authorization: `Bearer ${getAuthToken()}` }, cache: 'no-store' });
    if (response.status === 404) return null;
    if (!response.ok) throw new APIRequestError('No pudimos descargar tu avatar.', response.status);
    const mime = response.headers.get('Content-Type') ?? 'image/jpeg';
    const blob = await response.blob();
    if (Platform.OS === 'web') return URL.createObjectURL(blob);
    const extension = mime.includes('png') ? 'png' : mime.includes('webp') ? 'webp' : 'jpg';
    const file = new File(Paths.cache, `avatar-${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`);
    file.write(new Uint8Array(await blob.arrayBuffer()));
    return file.uri;
  },
  async saveMyAvatar(asset: ImagePickerAsset): Promise<void> {
    if (!getAuthToken()) throw new Error('Iniciá sesión para sincronizar el avatar.');
    if (asset.fileSize && asset.fileSize > 5 * 1024 * 1024) throw new Error('La foto supera los 5 MB. Elegí una imagen más liviana.');
    const mime = asset.mimeType ?? 'image/jpeg';
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(mime)) throw new Error('Elegí una imagen JPEG, PNG o WebP.');
    const data = new FormData();
    const name = asset.fileName ?? `avatar.${mime.split('/')[1]}`;
    if (Platform.OS === 'web' && asset.file) data.append('file', asset.file, name);
    else data.append('file', new File(asset.uri), name);
    const uploadFetch = Platform.OS === 'web' ? fetch : expoFetch;
    const response = await uploadFetch(`${baseURL}/v1/me/avatar`, { method: 'PUT', headers: { Authorization: `Bearer ${getAuthToken()}` }, body: data });
    if (!response.ok) {
      const body = await response.json().catch(() => null) as { error?: string } | null;
      throw new APIRequestError(apiErrorMessage(body?.error, response.status), response.status);
    }
  },
  async deleteMyAvatar(): Promise<void> {
    if (!getAuthToken()) return;
    const response = await fetch(`${baseURL}/v1/me/avatar`, { method: 'DELETE', headers: { Authorization: `Bearer ${getAuthToken()}` } });
    if (!response.ok) throw new APIRequestError('No pudimos quitar tu avatar.', response.status);
  },
  claimSession: (sessionId: string, playerId: string, hostToken: string) => request<{ status: 'ok' }>('/v1/me/claim-session', { method: 'POST', body: JSON.stringify({ sessionId, playerId, hostToken }) }),
  getCollection: (username: string, signal?: AbortSignal) => request<BGGCollection>(`/v1/bgg/collections/${encodeURIComponent(username)}`, { signal }),
  searchGames: (query: string) => request<BGGSearch>(`/v1/bgg/search?query=${encodeURIComponent(query.trim())}`),
  getGameRules: (gameId: number) => request<GameRules>(`/v1/bgg/games/${gameId}/rules`),
  interpretScoringText: (gameName: string, text: string) => request<PDFExtract>('/v1/ocr/scoring-text', { method: 'POST', body: JSON.stringify({ gameName, text }) }),
  suggestScoringDraft: (gameName: string, text: string) => request<{ scoringSuggestion: ScoringSuggestion | null }>('/v1/ai/scoring-suggestion', { method: 'POST', body: JSON.stringify({ gameName, text: text.slice(0, 120_000) }) }),
  async extractPDF(asset: DocumentPickerAsset, gameName = ''): Promise<PDFExtract> {
    const data = new FormData();
    if (Platform.OS === 'web' && asset.file) data.append('file', asset.file, asset.name);
    else data.append('file', new File(asset.uri), asset.name);
    if (gameName.trim()) data.append('gameName', gameName.trim());
    let response: Response;
    try {
      response = await fetch(`${baseURL}/v1/pdf/extract`, { method: 'POST', body: data });
    } catch {
      let apiReachable = false;
      try {
        apiReachable = (await fetch(`${baseURL}/health`)).ok;
      } catch {
        // The health check is only used to distinguish connection and upload errors.
      }
      if (apiReachable) {
        throw new Error('La API responde, pero no pudimos enviar el PDF. Probá con otro archivo o reintentá.');
      }
      throw new Error('No pudimos conectar con el servidor. Revisá la red del dispositivo.');
    }
    const body = await response.json().catch(() => null) as (PDFExtract & { error?: string }) | null;
    if (!response.ok) throw new Error(apiErrorMessage(body?.error, response.status));
    if (!body || typeof body.text !== 'string' || !Array.isArray(body.scoringExcerpts)) {
      throw new Error('El servicio de PDF devolvió una respuesta inválida.');
    }
    return { ...body, fileName: asset.name };
  },
  createTable: (name: string) =>
    request<AnonymousTable>('/v1/tables', { method: 'POST', body: JSON.stringify({ name }) }),
  currentSessionByTable: (code: string) => request<ScoreSession>(`/v1/tables/${encodeURIComponent(code)}/current-session`),
  createScoringRule: (rule: CreateScoringRule) => request<ScoringRule>('/v1/scoring-rules', { method: 'POST', body: JSON.stringify(rule) }),
  listScoringRules: () => request<ScoringRule[]>('/v1/scoring-rules'),
  searchCommunityRules: (query: string, bggId?: number) => request<ScoringRule[]>(`/v1/community/scoring-rules?query=${encodeURIComponent(query)}${bggId ? `&bggId=${bggId}` : ''}`),
  createScheduledGame: (tableCode: string, hostToken: string, gameName: string, scheduledAt: string, players: string[], ruleId?: string) => request<ScheduledGame>(`/v1/tables/${encodeURIComponent(tableCode)}/scheduled-games`, { method: 'POST', headers: { 'X-Table-Token': hostToken }, body: JSON.stringify({ gameName, scheduledAt, players, ruleId }) }),
  listScheduledGames: (tableCode: string, hostToken: string) => request<ScheduledGame[]>(`/v1/tables/${encodeURIComponent(tableCode)}/scheduled-games`, { headers: { 'X-Table-Token': hostToken } }),
  setScheduledGameRule: (id: string, hostToken: string, ruleId: string) => request<ScheduledGame>(`/v1/scheduled-games/${encodeURIComponent(id)}/rule`, { method: 'PATCH', headers: { 'X-Table-Token': hostToken }, body: JSON.stringify({ ruleId }) }),
  setScheduledGameSession: (id: string, hostToken: string, sessionId: string) => request<ScheduledGame>(`/v1/scheduled-games/${encodeURIComponent(id)}/session`, { method: 'PATCH', headers: { 'X-Table-Token': hostToken }, body: JSON.stringify({ sessionId }) }),
  updateScheduledGame: (id: string, hostToken: string, gameName: string, scheduledAt: string, players: string[]) => request<ScheduledGame>(`/v1/scheduled-games/${encodeURIComponent(id)}`, { method: 'PUT', headers: { 'X-Table-Token': hostToken }, body: JSON.stringify({ gameName, scheduledAt, players }) }),
  async deleteScheduledGame(id: string, hostToken: string): Promise<void> {
    const response = await fetch(`${baseURL}/v1/scheduled-games/${encodeURIComponent(id)}`, { method: 'DELETE', headers: { 'X-Table-Token': hostToken } });
    if (!response.ok) {
      const body = await response.json().catch(() => null) as { error?: string } | null;
      throw new APIRequestError(apiErrorMessage(body?.error, response.status), response.status);
    }
  },
  createSession: (tableCode: string, hostToken: string, ruleId: string, players: string[]) => request<ScoreSession>(`/v1/tables/${encodeURIComponent(tableCode)}/sessions`, { method: 'POST', headers: { 'X-Table-Token': hostToken }, body: JSON.stringify({ ruleId, players: players.map((name) => ({ name })) }) }),
  getSession: (sessionId: string) => request<ScoreSession>(`/v1/sessions/${encodeURIComponent(sessionId)}`),
  addPlayer: (sessionId: string, name: string) => request<ScoreSession>(`/v1/sessions/${encodeURIComponent(sessionId)}/players`, { method: 'POST', body: JSON.stringify({ name }) }),
  updateScores: (sessionId: string, values: ScoreSession['values']) => request<ScoreSession>(`/v1/sessions/${encodeURIComponent(sessionId)}/scores`, { method: 'PUT', body: JSON.stringify({ values }) }),
  setScore: (sessionId: string, playerId: string, fieldId: string, value: number) => request<ScoreSession>(`/v1/sessions/${encodeURIComponent(sessionId)}/scores`, { method: 'PATCH', body: JSON.stringify({ playerId, fieldId, value }) }),
  adjustPoints: (sessionId: string, playerId: string, delta: number) => request<ScoreSession>(`/v1/sessions/${encodeURIComponent(sessionId)}/points`, { method: 'POST', body: JSON.stringify({ playerId, delta }) }),
  finishSession: (sessionId: string, hostToken: string) => request<ScoreSession>(`/v1/sessions/${encodeURIComponent(sessionId)}/finish`, { method: 'POST', headers: { 'X-Table-Token': hostToken } }),
  pauseSession: (sessionId: string, hostToken: string) => request<ScoreSession>(`/v1/sessions/${encodeURIComponent(sessionId)}/pause`, { method: 'POST', headers: { 'X-Table-Token': hostToken } }),
  resumeSession: (sessionId: string, hostToken: string) => request<ScoreSession>(`/v1/sessions/${encodeURIComponent(sessionId)}/resume`, { method: 'POST', headers: { 'X-Table-Token': hostToken } }),
  boardPhotoURL: (sessionId: string, version?: string) => `${baseURL}/v1/sessions/${encodeURIComponent(sessionId)}/board-photo${version ? `?v=${encodeURIComponent(version)}` : ''}`,
  async saveBoardPhoto(sessionId: string, hostToken: string, asset: ImagePickerAsset): Promise<ScoreSession> {
    if (asset.fileSize && asset.fileSize > 5 * 1024 * 1024) throw new Error('La foto supera los 5 MB. Elegí una imagen más liviana.');
    const data = new FormData();
    const name = asset.fileName ?? 'tablero.jpg';
    if (Platform.OS === 'web' && asset.file) data.append('file', asset.file, name);
    else data.append('file', new File(asset.uri), name);
    const uploadFetch = Platform.OS === 'web' ? fetch : expoFetch;
    const response = await uploadFetch(`${baseURL}/v1/sessions/${encodeURIComponent(sessionId)}/board-photo`, { method: 'POST', headers: { 'X-Table-Token': hostToken }, body: data });
    const body = await response.json() as ScoreSession & { error?: string };
    if (!response.ok) throw new APIRequestError(apiErrorMessage(body.error, response.status), response.status);
    return body;
  },
  reopenSession: (sessionId: string, hostToken: string) => request<ScoreSession>(`/v1/sessions/${encodeURIComponent(sessionId)}/reopen`, { method: 'POST', headers: { 'X-Table-Token': hostToken } }),
};
