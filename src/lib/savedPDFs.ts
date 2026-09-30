import AsyncStorage from '@react-native-async-storage/async-storage';

import type { PDFExtract } from '@/lib/api';

const key = 'tablescore.pdfs.v1';

export type SavedPDF = { gameId?: number; gameName: string; document: PDFExtract; importedAt: string; textTruncated?: boolean };

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

export async function savePDFs(pdfs: SavedPDF[]): Promise<SavedPDF[]> {
  const bounded = pdfs.slice(0, 10).map((pdf) => ({
    ...pdf,
    textTruncated: pdf.textTruncated || pdf.document.text.length > 200_000,
    document: {
      ...pdf.document,
      text: pdf.document.text.slice(0, 200_000),
      scoringExcerpts: pdf.document.scoringExcerpts.slice(0, 30).map((excerpt) => excerpt.slice(0, 4_000)),
    },
  }));
  await AsyncStorage.setItem(key, JSON.stringify(bounded));
  return bounded;
}
