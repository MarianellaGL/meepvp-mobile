import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

import type { AnonymousTable } from '@/lib/api';

const tableKey = 'tablescore.table';
const sessionKey = 'tablescore.sessionId';
const selfPlayerKey = 'tablescore.selfPlayerId';

async function read(key: string): Promise<string | null> {
  if (Platform.OS === 'web') {
    return typeof localStorage === 'undefined' ? null : localStorage.getItem(key);
  }
  return SecureStore.getItemAsync(key);
}

async function write(key: string, value: string | null): Promise<void> {
  if (Platform.OS === 'web') {
    if (typeof localStorage === 'undefined') return;
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
    return;
  }
  if (value === null) await SecureStore.deleteItemAsync(key);
  else await SecureStore.setItemAsync(key, value);
}

export async function loadSavedGame(): Promise<{ table: AnonymousTable | null; sessionId: string | null; selfPlayerId: string | null }> {
  const [savedTable, sessionId, selfPlayerId] = await Promise.all([read(tableKey), read(sessionKey), read(selfPlayerKey)]);
  if (!savedTable) return { table: null, sessionId, selfPlayerId };
  try {
    const table = JSON.parse(savedTable) as AnonymousTable;
    if (typeof table.code === 'string' && typeof table.hostToken === 'string') {
      return { table, sessionId, selfPlayerId };
    }
  } catch {
    // A malformed old value should not prevent the app from opening.
  }
  await write(tableKey, null);
  return { table: null, sessionId, selfPlayerId };
}

export const saveTable = (table: AnonymousTable) => write(tableKey, JSON.stringify(table));
export const saveSessionId = (sessionId: string | null) => write(sessionKey, sessionId);
export const saveSelfPlayerId = (id: string | null) => write(selfPlayerKey, id);
