import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api, type CreateScoringRule } from '@/lib/api';
import { queryKeys } from '@/shared/api/queryKeys';
import { useTableScoreStore } from '@/stores/useTableScoreStore';

/** Saves a sheet; the device library keeps a copy so it works offline. */
export function useSaveSheet() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (rule: CreateScoringRule) => useTableScoreStore.getState().createScoringRule(rule),
    onSuccess: (rule) => {
      if (rule.bggId) void queryClient.invalidateQueries({ queryKey: queryKeys.game(rule.bggId), exact: true });
    },
  });
}

/** Asks the AI for categories from the rulebook text; the person reviews them. */
export function useProposeSheet() {
  return useMutation({
    mutationFn: ({ gameName, text }: { gameName: string; text: string }) => api.suggestScoringDraft(gameName, text),
  });
}
