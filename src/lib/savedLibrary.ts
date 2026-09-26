import AsyncStorage from '@react-native-async-storage/async-storage';

import type { CollectionGame, ScoringRule } from '@/lib/api';

const key = 'tablescore.library.v1';

export type SavedLibrary = {
  username: string;
  collection: CollectionGame[];
  scoringRules: ScoringRule[];
  players: string[];
  myPlayerName: string;
};

const emptyLibrary = (): SavedLibrary => ({ username: '', collection: [], scoringRules: [], players: [], myPlayerName: '' });

export async function loadSavedLibrary(): Promise<SavedLibrary> {
  const raw = await AsyncStorage.getItem(key);
  if (!raw) return emptyLibrary();
  try {
    const saved = JSON.parse(raw) as Partial<SavedLibrary>;
    return {
      username: typeof saved.username === 'string' ? saved.username : '',
      collection: Array.isArray(saved.collection) ? saved.collection.filter((game) => Number.isSafeInteger(game?.bggId) && typeof game?.name === 'string') : [],
      scoringRules: Array.isArray(saved.scoringRules) ? saved.scoringRules.filter((rule) => typeof rule?.id === 'string' && typeof rule?.gameName === 'string' && Array.isArray(rule?.fields)) : [],
      players: Array.isArray(saved.players) ? saved.players.filter((name) => typeof name === 'string' && name.trim()).map((name) => name.trim()) : [],
      myPlayerName: typeof saved.myPlayerName === 'string' ? saved.myPlayerName.trim() : '',
    };
  } catch {
    return emptyLibrary();
  }
}

export const saveLibrary = (library: SavedLibrary) => AsyncStorage.setItem(key, JSON.stringify(library));
