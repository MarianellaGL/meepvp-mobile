import { create } from 'zustand';

import { api, type AnonymousTable, type CollectionGame, type CreateScoringRule, type PDFExtract, type ScheduledGame, type ScoreSession, type ScoringRule } from '@/lib/api';
import { loadSavedGame, saveSelfPlayerId, saveSessionId, saveTable } from '@/lib/savedGame';
import { loadSavedLibrary, saveLibrary } from '@/lib/savedLibrary';
import { loadSavedPDFs, savePDFs, type SavedPDF } from '@/lib/savedPDFs';
import { requestReminderPermission, syncScoreSheetReminders } from '@/lib/sheetReminders';

type TableScoreState = {
  collection: CollectionGame[];
  username: string;
  knownPlayers: string[];
  myPlayerName: string;
  table: AnonymousTable | null;
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
  isReopeningSession: boolean;
  isJoiningSession: boolean;
  error: string | null;
  collectionStatus: string | null;
  loadCollection: (username: string) => Promise<void>;
  restore: () => Promise<void>;
  createTable: (name: string) => Promise<void>;
  createScoringRule: (rule: CreateScoringRule) => Promise<ScoringRule>;
  createScheduledGame: (gameName: string, scheduledAt: string, players: string[], ruleId?: string) => Promise<ScheduledGame>;
  loadScheduledGames: () => Promise<void>;
  setScheduledGameRule: (id: string, ruleId: string) => Promise<void>;
  setScheduledGameSession: (id: string, sessionId: string) => Promise<void>;
  savePDF: (gameName: string, gameId: number | undefined, document: PDFExtract) => Promise<void>;
  loadRules: () => Promise<void>;
  createSession: (ruleId: string, players: string[]) => Promise<ScoreSession>;
  joinSessionAsMe: (name: string) => Promise<void>;
  setMyPlayerName: (name: string) => Promise<void>;
  loadSession: (sessionId: string) => Promise<void>;
  updateScore: (playerId: string, fieldId: string, value: number) => Promise<void>;
  adjustPoints: (playerId: string, delta: number) => Promise<void>;
  finishSession: () => Promise<void>;
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
  isReopeningSession: false,
  isJoiningSession: false,
  error: null,
  collectionStatus: null,
  async restore() {
    if (get().isRestoring) return;
    set({ isRestoring: true, error: null });
    try {
      const [savedGame, savedLibrary, savedPDFs] = await Promise.all([loadSavedGame(), loadSavedLibrary(), loadSavedPDFs()]);
      const { table, sessionId, selfPlayerId } = savedGame;
      set({ table, selfPlayerId: sessionId ? selfPlayerId : null, username: savedLibrary.username, collection: savedLibrary.collection, rules: savedLibrary.scoringRules, savedPDFs, knownPlayers: savedLibrary.players, myPlayerName: savedLibrary.myPlayerName });
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
      if (sessionId) {
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
  async loadCollection(username) {
    set({ isLoadingCollection: true, error: null, collectionStatus: null });
    try {
      for (let attempt = 0; attempt < 5; attempt += 1) {
        const result = await api.getCollection(username.trim());
        if (result.status === 'ready') {
          const collection = result.games ?? [];
          set({ collection, username: username.trim(), collectionStatus: `${collection.length} juegos importados.` });
          try { await saveLibrary({ username: username.trim(), collection, scoringRules: get().rules, players: get().knownPlayers, myPlayerName: get().myPlayerName }); }
          catch { set({ error: 'Importamos los juegos, pero este dispositivo no pudo guardarlos.' }); }
          return;
        }
        const seconds = result.retryAfterSeconds ?? 5;
        set({ collectionStatus: `BoardGameGeek está preparando tu colección. Reintentamos en ${seconds} s…` });
        await new Promise<void>((resolve) => setTimeout(resolve, seconds * 1000));
      }
      throw new Error('BoardGameGeek todavía está preparando tu colección. Reintentá en un momento.');
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'No pudimos cargar tu colección.' });
      throw error;
    } finally {
		set({ isLoadingCollection: false });
    }
  },
  async createTable(name) {
    set({ isCreatingTable: true, error: null });
    try {
      const table = await api.createTable(name.trim() || 'Noche de juegos');
      set({ table, session: null, selfPlayerId: null, scheduledGames: [] });
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
    const savedPDFs = [imported, ...get().savedPDFs.filter((saved) => gameId ? saved.gameId !== gameId : saved.gameName.toLocaleLowerCase() !== name.toLocaleLowerCase())].slice(0, 10);
    await savePDFs(savedPDFs);
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
      set({ session, selfPlayerId });
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
      set({ session: updated, selfPlayerId });
      try { await saveSelfPlayerId(selfPlayerId); }
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
  async loadSession(sessionId) {
    if (get().isLoadingSession) return;
    set({ isLoadingSession: true, error: null });
    try {
      const session = await api.getSession(sessionId);
      const savedSelfPlayerId = get().selfPlayerId;
      const selfPlayerId = session.players.some((player) => player.id === savedSelfPlayerId) ? savedSelfPlayerId : null;
      set({ session, selfPlayerId });
      try { await saveSessionId(session.id); }
      catch { set({ error: 'Cargamos la partida, pero este dispositivo no pudo guardarla.' }); }
      if (!selfPlayerId) {
        try { await saveSelfPlayerId(null); }
        catch { set({ error: 'Cargamos la partida, pero este dispositivo no pudo actualizar tu identidad de jugador.' }); }
      }
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'No pudimos cargar la partida.' });
      throw error;
    } finally {
      set({ isLoadingSession: false });
    }
  },
  async updateScore(playerId, fieldId, value) {
    const { session, isUpdatingScore, isAdjustingPoints, isFinishingSession } = get();
    if (!session || session.status === 'finished' || isUpdatingScore || isAdjustingPoints || isFinishingSession) return;
    set({ isUpdatingScore: true, error: null });
    try { set({ session: await api.setScore(session.id, playerId, fieldId, value) }); }
    catch (error) { set({ error: error instanceof Error ? error.message : 'No pudimos actualizar los puntos.' }); throw error; }
    finally { set({ isUpdatingScore: false }); }
  },
  async adjustPoints(playerId, delta) {
    const { session, isUpdatingScore, isAdjustingPoints, isFinishingSession } = get();
    if (!session || session.status === 'finished' || isUpdatingScore || isAdjustingPoints || isFinishingSession) return;
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
