import { create } from 'zustand';
import type { ImagePickerAsset } from 'expo-image-picker';

import { api, APIRequestError, type AccountGameSession, type AnonymousTable, type CollectionGame, type CreateScoringRule, type PDFExtract, type ScheduledGame, type ScoreSession, type ScoringRule } from '@/lib/api';
import { loadSavedGame, mergeSavedTables, saveGuestSession, saveSelfPlayerId, saveSessionForTable, saveSessionId, saveTable, selectSavedTable } from '@/lib/savedGame';
import { loadSavedLibrary, saveLibrary } from '@/lib/savedLibrary';
import { loadSavedPDFs, savePDFs, type SavedPDF } from '@/lib/savedPDFs';
import { requestReminderPermission, syncScoreSheetReminders } from '@/lib/sheetReminders';

let collectionController: AbortController | null = null;
function waitForRetry(seconds: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) { reject(new Error('Importación cancelada.')); return; }
    const cancel = () => { clearTimeout(timer); reject(new Error('Importación cancelada.')); };
    const timer = setTimeout(() => { signal.removeEventListener('abort', cancel); resolve(); }, Math.max(1, Math.min(seconds, 30)) * 1000);
    signal.addEventListener('abort', cancel, { once: true });
  });
}

type TableScoreState = {
  collection: CollectionGame[];
  username: string;
  knownPlayers: string[];
  myPlayerName: string;
  table: AnonymousTable | null;
  tables: AnonymousTable[];
  tableSessions: Record<string, ScoreSession>;
  guestSession: ScoreSession | null;
  latestRule: ScoringRule | null;
  pdfDraft: PDFExtract | null;
  savedPDFs: SavedPDF[];
  rules: ScoringRule[];
  session: ScoreSession | null;
  scheduledGames: ScheduledGame[];
  selfPlayerId: string | null;
  isLoadingCollection: boolean;
  isCreatingTable: boolean;
  isRestoring: boolean;
  hasRestored: boolean;
  isLoadingSession: boolean;
  isUpdatingScore: boolean;
  isAdjustingPoints: boolean;
  isFinishingSession: boolean;
  isPausingSession: boolean;
  isResumingSession: boolean;
  isUploadingBoardPhoto: boolean;
  isReopeningSession: boolean;
  isJoiningSession: boolean;
  error: string | null;
  collectionStatus: string | null;
  loadCollection: (username: string) => Promise<void>;
  cancelCollection: () => void;
  restore: () => Promise<void>;
  syncAccountTables: (tables: AnonymousTable[], sessions: AccountGameSession[]) => Promise<void>;
  refreshTables: () => Promise<void>;
  selectTable: (code: string) => Promise<void>;
  createTable: (name: string) => Promise<void>;
  createScoringRule: (rule: CreateScoringRule) => Promise<ScoringRule>;
  createScheduledGame: (gameName: string, scheduledAt: string, players: string[], ruleId?: string) => Promise<ScheduledGame>;
  updateScheduledGame: (id: string, gameName: string, scheduledAt: string, players: string[]) => Promise<void>;
  deleteScheduledGame: (id: string) => Promise<void>;
  loadScheduledGames: () => Promise<void>;
  setScheduledGameRule: (id: string, ruleId: string) => Promise<void>;
  setScheduledGameSession: (id: string, sessionId: string) => Promise<void>;
  savePDF: (gameName: string, gameId: number | undefined, document: PDFExtract) => Promise<void>;
  loadRules: () => Promise<void>;
  createSession: (ruleId: string, players: string[]) => Promise<ScoreSession>;
  joinSessionAsMe: (name: string) => Promise<void>;
  setMyPlayerName: (name: string) => Promise<void>;
  loadSession: (sessionId: string, playerId?: string) => Promise<void>;
  refreshSession: (sessionId: string) => Promise<void>;
  updateScore: (playerId: string, fieldId: string, value: number) => Promise<void>;
  adjustPoints: (playerId: string, delta: number) => Promise<void>;
  finishSession: () => Promise<void>;
  pauseSession: () => Promise<void>;
  resumeSession: () => Promise<void>;
  saveBoardPhoto: (asset: ImagePickerAsset) => Promise<void>;
  reopenSession: () => Promise<void>;
  clearError: () => void;
  setPDFDraft: (draft: PDFExtract | null) => void;
};

export const useTableScoreStore = create<TableScoreState>((set, get) => ({
  collection: [],
  username: '',
  knownPlayers: [],
  myPlayerName: '',
  table: null,
  tables: [],
  tableSessions: {},
  guestSession: null,
  latestRule: null,
  pdfDraft: null,
  savedPDFs: [],
  rules: [],
  session: null,
  scheduledGames: [],
  selfPlayerId: null,
  isLoadingCollection: false,
  isCreatingTable: false,
  isRestoring: false,
  hasRestored: false,
  isLoadingSession: false,
  isUpdatingScore: false,
  isAdjustingPoints: false,
  isFinishingSession: false,
  isPausingSession: false,
  isResumingSession: false,
  isUploadingBoardPhoto: false,
  isReopeningSession: false,
  isJoiningSession: false,
  error: null,
  collectionStatus: null,
  async restore() {
    if (get().isRestoring) return;
    set({ isRestoring: true, error: null });
    try {
      const [savedGame, savedLibrary, savedPDFs] = await Promise.all([loadSavedGame(), loadSavedLibrary(), loadSavedPDFs()]);
      const { table, tables } = savedGame;
      const sessionId = table ? savedGame.sessions[table.code]?.sessionId ?? null : savedGame.guestSession?.sessionId ?? null;
      const selfPlayerId = table ? savedGame.sessions[table.code]?.selfPlayerId ?? null : savedGame.guestSession?.selfPlayerId ?? null;
      set({ table, tables, selfPlayerId: sessionId ? selfPlayerId : null, username: savedLibrary.username, collection: savedLibrary.collection, rules: savedLibrary.scoringRules, savedPDFs, knownPlayers: savedLibrary.players, myPlayerName: savedLibrary.myPlayerName });
      await get().refreshTables();
      if (savedGame.guestSession?.sessionId) {
        try {
          const guestSession = await api.getSession(savedGame.guestSession.sessionId);
          set({ guestSession, ...(!get().table && !get().session ? { session: guestSession, selfPlayerId: savedGame.guestSession.selfPlayerId } : {}) });
        } catch { /* Keep hosted tables available if a guest game is no longer reachable. */ }
      }
      if (table) {
        try {
          const scheduledGames = await api.listScheduledGames(table.code, table.hostToken);
          set({ scheduledGames });
          syncScoreSheetReminders(scheduledGames).catch(() => undefined);
        }
        catch { /* A schedule connection error must not hide the saved game. */ }
      }
      try {
        const rules = await api.listScoringRules();
        set({ rules });
        await saveLibrary({ username: savedLibrary.username, collection: savedLibrary.collection, scoringRules: rules, players: savedLibrary.players, myPlayerName: savedLibrary.myPlayerName });
      } catch {
        // Keep the local snapshot when offline.
      }
      if (sessionId && !get().session) {
        try {
          const session = await api.getSession(sessionId);
          set({ session, selfPlayerId: session.players.some((player) => player.id === selfPlayerId) ? selfPlayerId : null });
          if (savedLibrary.players.length === 0 && session.players.length > 0) {
            const knownPlayers = session.players.map((player) => player.name);
            set({ knownPlayers });
            await saveLibrary({ username: savedLibrary.username, collection: savedLibrary.collection, scoringRules: get().rules, players: knownPlayers, myPlayerName: savedLibrary.myPlayerName });
          }
        } catch {
          set({ error: 'No pudimos recuperar tu última partida. Revisá la conexión y reintentá.' });
        }
      }
    } catch {
      set({ error: 'No pudimos recuperar tus partidas guardadas.' });
    } finally {
      set({ isRestoring: false, hasRestored: true });
    }
  },
  async syncAccountTables(accountTables, accountSessions) {
    await mergeSavedTables(accountTables);
    const saved = await loadSavedGame();
    const tables = saved.tables;
    const linked = Object.fromEntries(accountSessions.map((session) => [session.id, session.myPlayerId]));
    const results = await Promise.allSettled(tables.map((table) => api.currentSessionByTable(table.code)));
    const tableSessions = { ...get().tableSessions };
    results.forEach((result, index) => {
      const code = tables[index].code;
      if (result.status === 'fulfilled') tableSessions[code] = result.value;
      else if (result.reason instanceof APIRequestError && result.reason.status === 404) delete tableSessions[code];
    });
    for (const session of Object.values(tableSessions)) {
      const playerId = linked[session.id] ?? saved.sessions[session.tableCode]?.selfPlayerId ?? null;
      await saveSessionForTable(session.tableCode, session.id, playerId);
    }
    const selected = tables.find((item) => item.code === saved.selectedCode) ?? tables.find((item) => tableSessions[item.code]) ?? tables[0] ?? null;
    const current = selected ? tableSessions[selected.code] ?? null : null;
    const currentPlayerId = current ? linked[current.id] ?? saved.sessions[selected!.code]?.selfPlayerId ?? null : null;
    set({ tables, table: selected, tableSessions, session: current, selfPlayerId: currentPlayerId });
  },
  async refreshTables() {
    const tables = get().tables;
    if (!tables.length) return;
    const results = await Promise.allSettled(tables.map((table) => api.currentSessionByTable(table.code)));
    const tableSessions = { ...get().tableSessions };
    results.forEach((result, index) => {
      const code = tables[index].code;
      if (result.status === 'fulfilled') tableSessions[code] = result.value;
      else if (result.reason instanceof APIRequestError && result.reason.status === 404) delete tableSessions[code];
    });
    const selected = get().table;
    if (selected && tableSessions[selected.code]) set({ tableSessions, session: tableSessions[selected.code] });
    else if (selected && get().session?.tableCode === selected.code && get().session?.status !== 'finished') set({ tableSessions, session: null, selfPlayerId: null });
    else set({ tableSessions });
  },
  async selectTable(code) {
    const table = get().tables.find((item) => item.code === code);
    if (!table) throw new Error('No encontramos esa mesa.');
    const saved = await loadSavedGame();
    let session: ScoreSession | null = get().tableSessions[code] ?? null;
    try { session = await api.currentSessionByTable(code); }
    catch (cause) { if (cause instanceof APIRequestError && cause.status === 404) session = null; else if (!session) throw cause; }
    await selectSavedTable(code);
    if (session) await saveSessionForTable(code, session.id, saved.sessions[code]?.sessionId === session.id ? saved.sessions[code]?.selfPlayerId ?? null : null);
    const tableSessions = { ...get().tableSessions };
    if (session) tableSessions[code] = session;
    else delete tableSessions[code];
    set({ table, session, tableSessions, selfPlayerId: session && saved.sessions[code]?.sessionId === session.id ? saved.sessions[code]?.selfPlayerId ?? null : null, scheduledGames: [] });
    get().loadScheduledGames().catch(() => undefined);
  },
  async loadCollection(username) {
    collectionController?.abort();
    const controller = new AbortController();
    collectionController = controller;
    set({ isLoadingCollection: true, error: null, collectionStatus: null });
    try {
      for (let attempt = 0; attempt < 5; attempt += 1) {
        let result;
        try { result = await api.getCollection(username.trim(), controller.signal); }
        catch (cause) {
          if (!(cause instanceof APIRequestError && cause.status === 429) || attempt === 4) throw cause;
          const seconds = cause.retryAfterSeconds ?? 10;
          set({ collectionStatus: `BoardGameGeek pidió esperar ${seconds} s antes de reintentar.` });
          await waitForRetry(seconds, controller.signal);
          continue;
        }
        if (controller.signal.aborted) return;
        if (result.status === 'ready') {
          const collection = result.games ?? [];
          set({ collection, username: username.trim(), collectionStatus: `${collection.length} juegos importados.` });
          try { await saveLibrary({ username: username.trim(), collection, scoringRules: get().rules, players: get().knownPlayers, myPlayerName: get().myPlayerName }); }
          catch { set({ error: 'Importamos los juegos, pero este dispositivo no pudo guardarlos.' }); }
          return;
        }
        const seconds = result.retryAfterSeconds ?? 5;
        set({ collectionStatus: `BoardGameGeek está preparando tu colección. Reintentamos en ${seconds} s…` });
        await waitForRetry(seconds, controller.signal);
      }
      throw new Error('BoardGameGeek todavía está preparando tu colección. Reintentá en un momento.');
    } catch (error) {
      if (controller.signal.aborted) return;
      set({ error: error instanceof Error ? error.message : 'No pudimos cargar tu colección.', collectionStatus: 'Tu colección anterior sigue disponible. Podés reintentar cuando quieras.' });
      throw error;
    } finally {
      if (collectionController === controller) { collectionController = null; set({ isLoadingCollection: false }); }
    }
  },
  cancelCollection() {
    collectionController?.abort();
    collectionController = null;
    set({ isLoadingCollection: false, collectionStatus: 'Importación cancelada. Tu colección anterior sigue disponible.' });
  },
  async createTable(name) {
    set({ isCreatingTable: true, error: null });
    try {
      const table = await api.createTable(name.trim() || 'Noche de juegos');
      set({ table, tables: [table, ...get().tables.filter((item) => item.code !== table.code)], session: null, selfPlayerId: null, scheduledGames: [] });
      try {
        await saveTable(table);
        await saveSessionId(null);
        await saveSelfPlayerId(null);
      } catch {
        set({ error: 'Creamos la mesa, pero este dispositivo no pudo guardarla.' });
      }
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'No pudimos crear la mesa.' });
      throw error;
    } finally {
      set({ isCreatingTable: false });
    }
  },
  async createScoringRule(rule) {
    set({ error: null });
    try {
      const latestRule = await api.createScoringRule(rule);
      const rules = [latestRule, ...get().rules.filter((saved) => saved.id !== latestRule.id)];
      set({ latestRule, rules });
      try { await saveLibrary({ username: get().username, collection: get().collection, scoringRules: rules, players: get().knownPlayers, myPlayerName: get().myPlayerName }); }
      catch { set({ error: 'Guardamos la planilla, pero este dispositivo no pudo guardar una copia sin conexión.' }); }
      return latestRule;
    }
    catch (error) { set({ error: error instanceof Error ? error.message : 'No pudimos guardar la regla de puntos.' }); throw error; }
  },
  async createScheduledGame(gameName, scheduledAt, players, ruleId) {
    if (!get().table) await get().createTable(`Mesa de ${gameName.trim() || 'Noche de juegos'}`);
    const table = get().table;
    if (!table) throw new Error('No pudimos crear la mesa para este juego.');
    try {
      const game = await api.createScheduledGame(table.code, table.hostToken, gameName.trim(), scheduledAt, players, ruleId);
      const scheduledGames = [...get().scheduledGames, game].sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt));
      set({ scheduledGames });
      try { if (await requestReminderPermission()) await syncScoreSheetReminders(scheduledGames); }
      catch { /* The game is saved even if this device cannot schedule a reminder. */ }
      return game;
    } catch (cause) {
      set({ error: cause instanceof Error ? cause.message : 'No pudimos programar la partida.' });
      throw cause;
    }
  },
  async updateScheduledGame(id, gameName, scheduledAt, players) {
    const game = get().scheduledGames.find((item) => item.id === id);
    const table = get().tables.find((item) => item.code === game?.tableCode);
    if (!table) throw new Error('No encontramos la mesa de esta partida.');
    const updated = await api.updateScheduledGame(id, table.hostToken, gameName, scheduledAt, players);
    const scheduledGames = get().scheduledGames.map((item) => item.id === id ? updated : item).sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt));
    set({ scheduledGames });
    syncScoreSheetReminders(scheduledGames).catch(() => undefined);
  },
  async deleteScheduledGame(id) {
    const game = get().scheduledGames.find((item) => item.id === id);
    const table = get().tables.find((item) => item.code === game?.tableCode);
    if (!table) throw new Error('No encontramos la mesa de esta partida.');
    await api.deleteScheduledGame(id, table.hostToken);
    const scheduledGames = get().scheduledGames.filter((item) => item.id !== id);
    set({ scheduledGames });
    syncScoreSheetReminders(scheduledGames).catch(() => undefined);
  },
  async loadScheduledGames() {
    const table = get().table;
    if (!table) return;
    try {
      const scheduledGames = await api.listScheduledGames(table.code, table.hostToken);
      set({ scheduledGames });
      syncScoreSheetReminders(scheduledGames).catch(() => undefined);
    }
    catch (cause) { set({ error: cause instanceof Error ? cause.message : 'No pudimos cargar las partidas programadas.' }); throw cause; }
  },
  async setScheduledGameRule(id, ruleId) {
    const table = get().table;
    if (!table) throw new Error('Primero creá una mesa.');
    try {
      const updated = await api.setScheduledGameRule(id, table.hostToken, ruleId);
      const scheduledGames = get().scheduledGames.map((game) => game.id === id ? updated : game);
      set({ scheduledGames });
      syncScoreSheetReminders(scheduledGames).catch(() => undefined);
    } catch (cause) {
      set({ error: cause instanceof Error ? cause.message : 'No pudimos vincular la planilla.' });
      throw cause;
    }
  },
  async setScheduledGameSession(id, sessionId) {
    const table = get().table;
    if (!table) throw new Error('Primero creá una mesa.');
    const updated = await api.setScheduledGameSession(id, table.hostToken, sessionId);
    const scheduledGames = get().scheduledGames.map((game) => game.id === id ? updated : game);
    set({ scheduledGames });
    syncScoreSheetReminders(scheduledGames).catch(() => undefined);
  },
  async savePDF(gameName, gameId, document) {
    const name = gameName.trim();
    if (!name) throw new Error('Ingresá el nombre del juego antes de guardar el PDF.');
    const imported: SavedPDF = { gameName: name, ...(gameId ? { gameId } : {}), document, importedAt: new Date().toISOString() };
    const savedPDFs = await savePDFs([imported, ...get().savedPDFs.filter((saved) => gameId ? saved.gameId !== gameId : saved.gameName.toLocaleLowerCase() !== name.toLocaleLowerCase())]);
    set({ savedPDFs });
  },
  async loadRules() {
    try {
      const rules = await api.listScoringRules();
      set({ rules });
      try { await saveLibrary({ username: get().username, collection: get().collection, scoringRules: rules, players: get().knownPlayers, myPlayerName: get().myPlayerName }); }
      catch { set({ error: 'Cargamos las planillas, pero este dispositivo no pudo guardar una copia sin conexión.' }); }
    }
    catch (error) { set({ error: error instanceof Error ? error.message : 'No pudimos cargar las planillas.' }); throw error; }
  },
  async createSession(ruleId, players) {
    const { table } = get();
    if (!table) throw new Error('Primero creá una mesa.');
    set({ error: null });
    try {
      const session = await api.createSession(table.code, table.hostToken, ruleId, players);
      const selfPlayerId = session.players[0]?.id ?? null;
      set({ session, selfPlayerId, tableSessions: { ...get().tableSessions, [table.code]: session } });
      const knownPlayers = [...get().knownPlayers];
      for (const name of players) {
        const cleaned = name.trim();
        if (cleaned && !knownPlayers.some((saved) => saved.toLocaleLowerCase() === cleaned.toLocaleLowerCase())) knownPlayers.push(cleaned);
      }
      set({ knownPlayers });
      try { await saveSessionId(session.id); }
      catch { set({ error: 'Empezó la partida, pero este dispositivo no pudo guardarla.' }); }
      try { await saveSelfPlayerId(selfPlayerId); }
      catch { set({ error: 'Empezó la partida, pero este dispositivo no pudo guardar tu identidad de jugador.' }); }
      try { await saveLibrary({ username: get().username, collection: get().collection, scoringRules: get().rules, players: knownPlayers, myPlayerName: get().myPlayerName }); }
      catch { set({ error: 'Empezó la partida, pero este dispositivo no pudo guardar la lista de jugadores.' }); }
      return session;
    }
    catch (error) { set({ error: error instanceof Error ? error.message : 'No pudimos empezar la partida.' }); throw error; }
  },
  async setMyPlayerName(name) {
    const myPlayerName = name.trim();
    if (!myPlayerName) return;
    set({ myPlayerName });
    try { await saveLibrary({ username: get().username, collection: get().collection, scoringRules: get().rules, players: get().knownPlayers, myPlayerName }); }
    catch { set({ error: 'No pudimos guardar tu nombre de jugador en este dispositivo.' }); }
  },
  async joinSessionAsMe(name) {
    const { session, isJoiningSession } = get();
    if (!session || isJoiningSession) return;
    const myPlayerName = name.trim();
    if (!myPlayerName) throw new Error('Ingresá tu nombre de jugador.');
    set({ isJoiningSession: true, error: null });
    try {
      const updated = await api.addPlayer(session.id, myPlayerName);
      const selfPlayerId = updated.players.find((player) => player.name.toLocaleLowerCase() === myPlayerName.toLocaleLowerCase())?.id ?? null;
      set({ session: updated, selfPlayerId, ...(get().table?.code !== updated.tableCode ? { guestSession: updated } : {}) });
      try {
        if (get().table?.code === updated.tableCode) await saveSessionForTable(updated.tableCode, updated.id, selfPlayerId);
        else await saveGuestSession(updated.id, selfPlayerId);
      }
      catch { set({ error: 'Te uniste, pero este dispositivo no pudo guardar tu identidad de jugador.' }); }
      await get().setMyPlayerName(myPlayerName);
      const knownPlayers = [...get().knownPlayers];
      if (!knownPlayers.some((saved) => saved.toLocaleLowerCase() === myPlayerName.toLocaleLowerCase())) {
        knownPlayers.push(myPlayerName);
        set({ knownPlayers });
        try { await saveLibrary({ username: get().username, collection: get().collection, scoringRules: get().rules, players: knownPlayers, myPlayerName }); }
        catch { set({ error: 'Te uniste, pero este dispositivo no pudo guardar la lista de jugadores.' }); }
      }
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'No pudimos sumarte a esta partida.' });
      throw error;
    } finally {
      set({ isJoiningSession: false });
    }
  },
  async loadSession(sessionId, playerId) {
    if (get().isLoadingSession) return;
    set({ isLoadingSession: true, error: null });
    try {
      const session = await api.getSession(sessionId);
      const saved = await loadSavedGame();
      const owned = get().tables.find((table) => table.code === session.tableCode);
      const savedSelfPlayerId = playerId ?? (owned && saved.sessions[owned.code]?.sessionId === sessionId ? saved.sessions[owned.code]?.selfPlayerId : saved.guestSession?.sessionId === sessionId ? saved.guestSession.selfPlayerId : null);
      const selfPlayerId = session.players.some((player) => player.id === savedSelfPlayerId) ? savedSelfPlayerId : null;
      set({ session, selfPlayerId, ...(owned ? { table: owned, tableSessions: { ...get().tableSessions, [owned.code]: session } } : { guestSession: session }) });
      try {
        if (owned) { await selectSavedTable(owned.code); await saveSessionForTable(owned.code, session.id, selfPlayerId); }
        else await saveGuestSession(session.id, selfPlayerId);
      }
      catch { set({ error: 'Cargamos la partida, pero este dispositivo no pudo guardarla.' }); }
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'No pudimos cargar la partida.' });
      throw error;
    } finally {
      set({ isLoadingSession: false });
    }
  },
  async refreshSession(sessionId) {
    const { session, isUpdatingScore, isAdjustingPoints, isFinishingSession } = get();
    if (session?.id !== sessionId || isUpdatingScore || isAdjustingPoints || isFinishingSession) return;
    try {
      const updated = await api.getSession(sessionId);
      const current = get();
      if (current.session?.id === sessionId && !current.isUpdatingScore && !current.isAdjustingPoints && !current.isFinishingSession && Date.parse(updated.lastModified) >= Date.parse(current.session.lastModified)) set({ session: updated, ...(current.guestSession?.id === sessionId ? { guestSession: updated } : {}) });
    } catch { /* Keep the last known score while the connection recovers. */ }
  },
  async updateScore(playerId, fieldId, value) {
    const { session, isUpdatingScore, isAdjustingPoints, isFinishingSession } = get();
    if (!session || session.status !== 'active' || isUpdatingScore || isAdjustingPoints || isFinishingSession) return;
    set({ isUpdatingScore: true, error: null });
    try { set({ session: await api.setScore(session.id, playerId, fieldId, value) }); }
    catch (error) { set({ error: error instanceof Error ? error.message : 'No pudimos actualizar los puntos.' }); throw error; }
    finally { set({ isUpdatingScore: false }); }
  },
  async adjustPoints(playerId, delta) {
    const { session, isUpdatingScore, isAdjustingPoints, isFinishingSession } = get();
    if (!session || session.status !== 'active' || isUpdatingScore || isAdjustingPoints || isFinishingSession) return;
    if (!Number.isSafeInteger(delta) || delta === 0 || Math.abs(delta) > 10000) throw new Error('Ingresá entre 1 y 10.000 puntos.');
    set({ isAdjustingPoints: true, error: null });
    try { set({ session: await api.adjustPoints(session.id, playerId, delta) }); }
    catch (error) { set({ error: error instanceof Error ? error.message : 'No pudimos actualizar los puntos.' }); throw error; }
    finally { set({ isAdjustingPoints: false }); }
  },
  async finishSession() {
    const { session, table, isUpdatingScore, isAdjustingPoints, isFinishingSession } = get();
    if (!session || session.status === 'finished' || isUpdatingScore || isAdjustingPoints || isFinishingSession) return;
    if (!table || table.code !== session.tableCode) throw new Error('Solo el anfitrión puede terminar esta partida.');
    set({ isFinishingSession: true, error: null });
    try { set({ session: await api.finishSession(session.id, table.hostToken) }); }
    catch (error) { set({ error: error instanceof Error ? error.message : 'No pudimos terminar la partida.' }); throw error; }
    finally { set({ isFinishingSession: false }); }
  },
  async pauseSession() {
    const { session, table, isPausingSession } = get();
    if (!session || session.status !== 'active' || isPausingSession) return;
    if (!table || table.code !== session.tableCode) throw new Error('Solo el anfitrión puede pausar esta partida.');
    set({ isPausingSession: true, error: null });
    try { set({ session: await api.pauseSession(session.id, table.hostToken) }); }
    catch (cause) { set({ error: cause instanceof Error ? cause.message : 'No pudimos pausar la partida.' }); throw cause; }
    finally { set({ isPausingSession: false }); }
  },
  async resumeSession() {
    const { session, table, isResumingSession } = get();
    if (!session || session.status !== 'paused' || isResumingSession) return;
    if (!table || table.code !== session.tableCode) throw new Error('Solo el anfitrión puede reanudar esta partida.');
    set({ isResumingSession: true, error: null });
    try { set({ session: await api.resumeSession(session.id, table.hostToken) }); }
    catch (cause) { set({ error: cause instanceof Error ? cause.message : 'No pudimos reanudar la partida.' }); throw cause; }
    finally { set({ isResumingSession: false }); }
  },
  async saveBoardPhoto(asset) {
    const { session, table, isUploadingBoardPhoto } = get();
    if (!session || isUploadingBoardPhoto) return;
    if (!table || table.code !== session.tableCode) throw new Error('Solo el anfitrión puede guardar la foto del tablero.');
    set({ isUploadingBoardPhoto: true, error: null });
    try { set({ session: await api.saveBoardPhoto(session.id, table.hostToken, asset) }); }
    catch (cause) { set({ error: cause instanceof Error ? cause.message : 'No pudimos guardar la foto del tablero.' }); throw cause; }
    finally { set({ isUploadingBoardPhoto: false }); }
  },
  async reopenSession() {
    const { session, table, isReopeningSession } = get();
    if (!session || !table || table.code !== session.tableCode || isReopeningSession) return;
    set({ isReopeningSession: true, error: null });
    try { set({ session: await api.reopenSession(session.id, table.hostToken) }); }
    catch (error) { set({ error: error instanceof Error ? error.message : 'No pudimos reabrir la partida.' }); throw error; }
    finally { set({ isReopeningSession: false }); }
  },
  clearError: () => set({ error: null }),
  setPDFDraft: (pdfDraft) => set({ pdfDraft }),
}));
