import { create } from 'zustand';

import { api, APIRequestError, setAuthToken, type AccountGameSession, type AccountStats, type AccountUser, type AuthSession } from '@/lib/api';
import { loadAuthToken, saveAuthToken } from '@/lib/authSession';
import { loadSavedGame } from '@/lib/savedGame';

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
        set({ error: cause instanceof Error ? cause.message : 'Could not restore your account.' });
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
      set({ error: cause instanceof Error ? cause.message : 'Could not create account.' });
      throw cause;
    } finally { set({ isBusy: false }); }
  },
  async logIn(username, password) {
    set({ isBusy: true, error: null });
    try {
      await acceptSession(await api.logIn(username.trim(), password), set, get);
    } catch (cause) {
      set({ error: cause instanceof Error ? cause.message : 'Could not log in.' });
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
      const [stats, sessions] = await Promise.all([api.getMyStats(), api.getMySessions()]);
      set({ stats, sessions, error: null });
    } catch (cause) {
      if (cause instanceof APIRequestError && cause.status === 401) {
        setAuthToken(null);
        await saveAuthToken(null);
        set({ user: null, stats: null, sessions: [] });
      }
      set({ error: cause instanceof Error ? cause.message : 'Could not load your stats.' });
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
    if (saved.table && saved.sessionId && saved.selfPlayerId) {
      await api.claimSession(saved.sessionId, saved.selfPlayerId, saved.table.hostToken);
    }
  } catch { claimError = true; }
  await get().refresh();
  if (claimError) set({ error: 'Signed in, but your previous game could not be added to this account.' });
}
