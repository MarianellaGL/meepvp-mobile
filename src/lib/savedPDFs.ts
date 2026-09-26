import AsyncStorage from '@react-native-async-storage/async-storage';

import type { PDFExtract } from '@/lib/api';

const key = 'tablescore.pdfs.v1';

export type SavedPDF = { gameId?: number; gameName: string; document: PDFExtract; importedAt: string };

export async function loadSavedPDFs(): Promise<SavedPDF[]> {
  const raw = await AsyncStorage.getItem(key);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as SavedPDF[];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item) =>
      typeof item?.gameName === 'string' &&
      typeof item?.document?.fileName === 'string' &&
      typeof item?.document?.text === 'string' &&
      Array.isArray(item?.document?.scoringExcerpts)
    );
  } catch {
    return [];
  }
}

export async function savePDFs(pdfs: SavedPDF[]): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(pdfs));
}
