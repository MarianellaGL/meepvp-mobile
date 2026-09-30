import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

import type { AnonymousTable } from '@/lib/api';

const key = 'meepvp.savedGames.v2';
const tableKey = 'tablescore.table';
const sessionKey = 'tablescore.sessionId';
const selfPlayerKey = 'tablescore.selfPlayerId';
const tokenKey = (code: string) => `meepvp.tableToken.${code}`;

export type SavedGame = {
  tables: AnonymousTable[];
  selectedCode: string | null;
  sessions: Record<string, { sessionId: string | null; selfPlayerId: string | null }>;
  guestSession?: { sessionId: string; selfPlayerId: string | null };
};

async function read(key: string): Promise<string | null> {
  if (Platform.OS === 'web') {
    return typeof localStorage === 'undefined' ? null : localStorage.getItem(key);
  }
  return SecureStore.getItemAsync(key);
}

async function readSaved(): Promise<string | null> {
  if (Platform.OS === 'web') return read(key);
  return AsyncStorage.getItem(key);
}

async function writeSaved(saved: SavedGame): Promise<void> {
  if (Platform.OS === 'web') {
    if (typeof localStorage !== 'undefined') localStorage.setItem(key, JSON.stringify(saved));
    return;
  }
  for (const table of saved.tables) await SecureStore.setItemAsync(tokenKey(table.code), table.hostToken);
  const metadata = { ...saved, tables: saved.tables.map(({ hostToken: _token, ...table }) => table) };
  await AsyncStorage.setItem(key, JSON.stringify(metadata));
}

function validTable(value: unknown): value is AnonymousTable {
  if (!value || typeof value !== 'object') return false;
  const table = value as AnonymousTable;
  return typeof table.code === 'string' && typeof table.hostToken === 'string' && table.hostToken.length > 0 && typeof table.name === 'string';
}

export async function loadSavedGame(): Promise<SavedGame & { table: AnonymousTable | null; sessionId: string | null; selfPlayerId: string | null }> {
  let saved: SavedGame | null = null;
  const raw = await readSaved() ?? await read(key);
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as SavedGame;
      if (Array.isArray(parsed.tables) && parsed.sessions && typeof parsed.sessions === 'object') {
        const tables = await Promise.all(parsed.tables.map(async (item) => ({ ...item, hostToken: item.hostToken || (Platform.OS === 'web' ? '' : await SecureStore.getItemAsync(tokenKey(item.code))) || '' })));
        saved = { tables: tables.filter(validTable), selectedCode: parsed.selectedCode ?? null, sessions: parsed.sessions, guestSession: parsed.guestSession };
      }
    } catch { /* Migrate the old snapshot below. */ }
  }
  if (!saved) {
    const [oldTable, sessionId, selfPlayerId] = await Promise.all([read(tableKey), read(sessionKey), read(selfPlayerKey)]);
    let table: AnonymousTable | null = null;
    try { const parsed: unknown = oldTable ? JSON.parse(oldTable) : null; if (validTable(parsed)) table = parsed; }
    catch { /* Ignore invalid old data. */ }
    saved = { tables: table ? [table] : [], selectedCode: table?.code ?? null, sessions: table ? { [table.code]: { sessionId, selfPlayerId } } : {}, guestSession: !table && sessionId ? { sessionId, selfPlayerId } : undefined };
    await writeSaved(saved);
  } else if (Platform.OS !== 'web' && !(await AsyncStorage.getItem(key))) {
    await writeSaved(saved);
  }
  const table = saved.tables.find((item) => item.code === saved.selectedCode) ?? saved.tables[0] ?? null;
  const current = table ? saved.sessions[table.code] : null;
  return { ...saved, selectedCode: table?.code ?? null, table, sessionId: table ? current?.sessionId ?? null : saved.guestSession?.sessionId ?? null, selfPlayerId: table ? current?.selfPlayerId ?? null : saved.guestSession?.selfPlayerId ?? null };
}

async function update(change: (saved: SavedGame) => void): Promise<void> {
  const { tables, selectedCode, sessions, guestSession } = await loadSavedGame();
  const saved: SavedGame = { tables, selectedCode, sessions, guestSession };
  change(saved);
  await writeSaved(saved);
}

export const saveTable = (table: AnonymousTable) => update((saved) => {
  saved.tables = [table, ...saved.tables.filter((item) => item.code !== table.code)];
  saved.selectedCode = table.code;
});

export const mergeSavedTables = (tables: AnonymousTable[]) => update((saved) => {
  for (const table of tables) saved.tables = [table, ...saved.tables.filter((item) => item.code !== table.code)];
  if (!saved.selectedCode && saved.tables[0]) saved.selectedCode = saved.tables[0].code;
});

export const selectSavedTable = (code: string) => update((saved) => {
  if (saved.tables.some((table) => table.code === code)) saved.selectedCode = code;
});

export const saveSessionForTable = (code: string, sessionId: string | null, selfPlayerId: string | null) => update((saved) => {
  saved.sessions[code] = { sessionId, selfPlayerId };
});

export const saveSessionId = (sessionId: string | null) => update((saved) => {
  if (saved.selectedCode) saved.sessions[saved.selectedCode] = { sessionId, selfPlayerId: saved.sessions[saved.selectedCode]?.selfPlayerId ?? null };
  else saved.guestSession = sessionId ? { sessionId, selfPlayerId: saved.guestSession?.selfPlayerId ?? null } : undefined;
});

export const saveSelfPlayerId = (selfPlayerId: string | null) => update((saved) => {
  if (saved.selectedCode) saved.sessions[saved.selectedCode] = { sessionId: saved.sessions[saved.selectedCode]?.sessionId ?? null, selfPlayerId };
  else if (saved.guestSession) saved.guestSession.selfPlayerId = selfPlayerId;
});

export const saveGuestSession = (sessionId: string, selfPlayerId: string | null) => update((saved) => {
  saved.guestSession = { sessionId, selfPlayerId };
});
