import { useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api';

export function useGameRules(gameId: number) {
  const valid = Number.isSafeInteger(gameId) && gameId > 0;
  return useQuery({
    queryKey: ['bgg-rules', gameId],
    queryFn: () => api.getGameRules(gameId),
    enabled: valid,
    retry: false,
  });
}
