import { router } from 'expo-router';

import type { PDFExtract } from '@/lib/api';
import { useTableScoreStore } from '@/stores/useTableScoreStore';

type EditorContext = { game?: string; gameId?: string; flow?: string; replace?: boolean };

/** Opens the sheet editor on an extracted rulebook, PDF or saved document. */
export function openSheetEditor(document: PDFExtract, { game, gameId, flow, replace }: EditorContext) {
  const store = useTableScoreStore.getState();
  store.setPDFDraft(document);
  const name = game?.trim() || document.scoringSuggestion?.gameName || document.rulebook?.name.replace(/\s+Rulebook$/i, '') || '';
  // A local copy lets the person come back to this text without reading it again.
  if (name) store.savePDF(name, Number(gameId) > 0 ? Number(gameId) : undefined, document).catch(() => undefined);
  const params = { fromPdf: '1', ...(name ? { game: name } : {}), ...(gameId ? { gameId } : {}), ...(flow === 'setup' ? { flow: 'setup' } : {}) };
  if (replace) router.replace({ pathname: '/rules/new', params });
  else router.push({ pathname: '/rules/new', params });
}
