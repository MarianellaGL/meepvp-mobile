import { create } from 'zustand';

import { api, APIRequestError, setAuthToken, type AccountGameSession, type AccountStats, type AccountUser, type AuthSession } from '@/lib/api';
import { loadAuthToken, saveAuthToken } from '@/lib/authSession';
import { loadSavedGame } from '@/lib/savedGame';
import { useTableScoreStore } from '@/stores/useTableScoreStore';

type AuthState = {
  user: AccountUser | null;
  stats: AccountStats | null;
  sessions: AccountGameSession[];
  isRestoring: boolean;
  hasRestored: boolean;
  isBusy: boolean;
  error: string | null;
  restore: () => Promise<void>;
  signUp: (username: string, password: string) => Promise<void>;
  logIn: (username: string, password: string) => Promise<void>;
  logOut: () => Promise<void>;
  refresh: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  stats: null,
  sessions: [],
  isRestoring: false,
  hasRestored: false,
  isBusy: false,
  error: null,
  async restore() {
    if (get().hasRestored || get().isRestoring) return;
    set({ isRestoring: true, error: null });
    try {
      const token = await loadAuthToken();
      if (!token) return;
      setAuthToken(token);
      const user = await api.getMe();
      set({ user });
      await get().refresh();
    } catch (cause) {
      if (cause instanceof APIRequestError && cause.status === 401) {
        setAuthToken(null);
        await saveAuthToken(null);
      } else {
        set({ error: cause instanceof Error ? cause.message : 'No pudimos recuperar tu cuenta.' });
      }
    } finally {
      set({ isRestoring: false, hasRestored: true });
    }
  },
  async signUp(username, password) {
    set({ isBusy: true, error: null });
    try {
      await acceptSession(await api.signUp(username.trim(), password), set, get);
    } catch (cause) {
      set({ error: cause instanceof Error ? cause.message : 'No pudimos crear la cuenta.' });
      throw cause;
    } finally { set({ isBusy: false }); }
  },
  async logIn(username, password) {
    set({ isBusy: true, error: null });
    try {
      await acceptSession(await api.logIn(username.trim(), password), set, get);
    } catch (cause) {
      set({ error: cause instanceof Error ? cause.message : 'No pudimos iniciar sesión.' });
      throw cause;
    } finally { set({ isBusy: false }); }
  },
  async logOut() {
    set({ isBusy: true, error: null });
    try { await api.logOut(); }
    catch { /* Remove the local session even if the API is offline. */ }
    finally {
      setAuthToken(null);
      await saveAuthToken(null);
      set({ user: null, stats: null, sessions: [], isBusy: false });
    }
  },
  async refresh() {
    if (!get().user) return;
    try {
      const [stats, sessions, tables] = await Promise.all([api.getMyStats(), api.getMySessions(), api.getMyTables()]);
      set({ stats, sessions, error: null });
      await useTableScoreStore.getState().syncAccountTables(tables, sessions);
    } catch (cause) {
      if (cause instanceof APIRequestError && cause.status === 401) {
        setAuthToken(null);
        await saveAuthToken(null);
        set({ user: null, stats: null, sessions: [] });
      }
      set({ error: cause instanceof Error ? cause.message : 'No pudimos cargar tus estadísticas.' });
      throw cause;
    }
  },
}));

async function acceptSession(session: AuthSession, set: typeof useAuthStore.setState, get: typeof useAuthStore.getState) {
  setAuthToken(session.token);
  await saveAuthToken(session.token);
  set({ user: session.user, hasRestored: true, stats: null, sessions: [] });
  let claimError = false;
  try {
    const saved = await loadSavedGame();
    for (const table of saved.tables) {
      try {
        await api.claimTable(table.code, table.hostToken);
        const linked = saved.sessions[table.code];
        if (linked?.sessionId && linked.selfPlayerId) await api.claimSession(linked.sessionId, linked.selfPlayerId, table.hostToken);
      } catch { claimError = true; }
    }
  } catch { claimError = true; }
  await get().refresh();
  if (claimError) set({ error: 'Iniciaste sesión, pero no pudimos vincular tu partida anterior a la cuenta.' });
}
