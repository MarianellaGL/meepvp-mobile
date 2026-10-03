import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { ScoringRule } from '@/lib/api';
import { queryKeys } from '@/shared/api/queryKeys';
import { useTableScoreStore } from '@/stores/useTableScoreStore';
import { gamesApi } from './api';

const validGameId = (bggId: number) => Number.isSafeInteger(bggId) && bggId > 0;

export function useGame(bggId: number, name?: string) {
  return useQuery({
    queryKey: queryKeys.game(bggId),
    queryFn: () => gamesApi.get(bggId, name),
    enabled: validGameId(bggId),
  });
}

/** Server sheets for the game plus the ones saved only on this device. */
export function useGameSheets(bggId: number, name: string): ScoringRule[] {
  const game = useGame(bggId, name);
  const local = useTableScoreStore((state) => state.rules);
  const key = name.trim().toLocaleLowerCase();
  const server = game.data?.scoringRules ?? [];
  const ids = new Set(server.map((rule) => rule.id));
  const deviceOnly = local.filter((rule) => !ids.has(rule.id) && (rule.bggId === bggId || (!rule.bggId && rule.gameName.trim().toLocaleLowerCase() === key)));
  return [...server, ...deviceOnly];
}

export function useAskRule(bggId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (question: string) => gamesApi.ask(bggId, question),
    onSuccess: (answer, question) => {
      queryClient.setQueryData(queryKeys.ruleAnswer(bggId, question), answer);
      // The first question reads the rulebook, which changes its textReady flag.
      void queryClient.invalidateQueries({ queryKey: queryKeys.game(bggId), exact: true });
    },
  });
}
