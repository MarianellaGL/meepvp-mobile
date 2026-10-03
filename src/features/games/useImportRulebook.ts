import { useMutation } from '@tanstack/react-query';
import { router } from 'expo-router';

import { api, type Rulebook } from '@/lib/api';
import { useTableScoreStore } from '@/stores/useTableScoreStore';

type ImportContext = { game?: string; gameId?: string; flow?: string };

/** Reads a catalog rulebook and opens the reader to turn it into a sheet. */
export function useImportRulebook() {
  return useMutation({
    mutationFn: ({ book }: { book: Rulebook; context: ImportContext }) => api.extractRulebook(book.id),
    onSuccess: (document, { book, context }) => {
      useTableScoreStore.getState().setPDFDraft(document);
      const game = context.game || document.scoringSuggestion?.gameName || book.name.replace(/\s+Rulebook$/i, '');
      router.push({ pathname: '/pdf/reader', params: { rulebookId: book.id, game, ...(context.gameId ? { gameId: context.gameId } : {}), ...(context.flow === 'setup' ? { flow: 'setup' } : {}) } });
    },
  });
}
