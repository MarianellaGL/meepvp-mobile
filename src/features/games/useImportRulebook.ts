import { useMutation } from '@tanstack/react-query';

import { openSheetEditor } from '@/features/sheets/openSheetEditor';
import { api, type Rulebook } from '@/lib/api';

type ImportContext = { game?: string; gameId?: string; flow?: string };

/** Reads a catalog rulebook and opens the sheet editor on it. */
export function useImportRulebook() {
  return useMutation({
    mutationFn: ({ book }: { book: Rulebook; context: ImportContext }) => api.extractRulebook(book.id),
    onSuccess: (document, { context }) => openSheetEditor(document, context),
  });
}
