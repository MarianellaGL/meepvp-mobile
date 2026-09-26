import { create } from 'zustand';

import { api, type AnonymousTable, type CollectionGame, type CreateScoringRule, type ScoreSession, type ScoringRule } from '@/lib/api';

type TableScoreState = {
  collection: CollectionGame[];
  table: AnonymousTable | null;
  latestRule: ScoringRule | null;
  rules: ScoringRule[];
  session: ScoreSession | null;
  isLoadingCollection: boolean;
  isCreatingTable: boolean;
  error: string | null;
  collectionStatus: string | null;
  loadCollection: (username: string) => Promise<void>;
  createTable: (name: string) => Promise<void>;
  createScoringRule: (rule: CreateScoringRule) => Promise<void>;
  loadRules: () => Promise<void>;
  createSession: (ruleId: string, players: string[]) => Promise<ScoreSession>;
  updateScore: (playerId: string, fieldId: string, value: number) => Promise<void>;
  finishSession: () => Promise<void>;
  clearError: () => void;
};

export const useTableScoreStore = create<TableScoreState>((set, get) => ({
  collection: [],
  table: null,
  latestRule: null,
  rules: [],
  session: null,
  isLoadingCollection: false,
  isCreatingTable: false,
  error: null,
  collectionStatus: null,
  async loadCollection(username) {
	set({ isLoadingCollection: true, error: null, collectionStatus: null });
    try {
		for (let attempt = 0; attempt < 5; attempt += 1) {
			const result = await api.getCollection(username.trim());
			if (result.status === 'ready') {
				set({ collection: result.games ?? [], collectionStatus: `${result.games?.length ?? 0} games imported.` });
				return;
			}
			const seconds = result.retryAfterSeconds ?? 5;
			set({ collectionStatus: `BoardGameGeek is preparing your collection. Retrying in ${seconds}s…` });
			await new Promise<void>((resolve) => setTimeout(resolve, seconds * 1000));
		}
		throw new Error('BoardGameGeek is still preparing your collection. Please try again in a moment.');
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Unable to load your collection.' });
      throw error;
    } finally {
		set({ isLoadingCollection: false });
    }
  },
  async createTable(name) {
    set({ isCreatingTable: true, error: null });
    try {
      const table = await api.createTable(name.trim() || 'Game night');
      set({ table });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Unable to create a table.' });
      throw error;
    } finally {
      set({ isCreatingTable: false });
    }
  },
  async createScoringRule(rule) {
    set({ error: null });
    try { const latestRule = await api.createScoringRule(rule); set({ latestRule }); }
    catch (error) { set({ error: error instanceof Error ? error.message : 'Unable to save the scoring rule.' }); throw error; }
  },
  async loadRules() {
    try { set({ rules: await api.listScoringRules() }); }
    catch (error) { set({ error: error instanceof Error ? error.message : 'Unable to load scoring sheets.' }); throw error; }
  },
  async createSession(ruleId, players) {
    const { table } = get();
    if (!table) throw new Error('Create a table first.');
    set({ error: null });
    try { const session = await api.createSession(table.code, table.hostToken, ruleId, players); set({ session }); return session; }
    catch (error) { set({ error: error instanceof Error ? error.message : 'Unable to create the game session.' }); throw error; }
  },
  async updateScore(playerId, fieldId, value) {
    const { session } = get(); if (!session) return;
    const values = { ...session.values, [playerId]: { ...session.values[playerId], [fieldId]: value } };
    try { set({ session: await api.updateScores(session.id, values) }); }
    catch (error) { set({ error: error instanceof Error ? error.message : 'Unable to update the score.' }); throw error; }
  },
  async finishSession() {
    const { session } = get(); if (!session) return;
    try { set({ session: await api.finishSession(session.id) }); }
    catch (error) { set({ error: error instanceof Error ? error.message : 'Unable to finish the game.' }); throw error; }
  },
  clearError: () => set({ error: null }),
}));
