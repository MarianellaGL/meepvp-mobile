import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api';
import { useTableScoreStore } from '@/stores/useTableScoreStore';

export function useCommunityRules(initialGame = '', bggId?: number) {
  const [query, setQuery] = useState(initialGame);
  const [submittedQuery, setSubmittedQuery] = useState(initialGame.trim());
  const setScheduledGameRule = useTableScoreStore((state) => state.setScheduledGameRule);
  const results = useQuery({
    queryKey: ['community-rules', submittedQuery, bggId],
    queryFn: () => api.searchCommunityRules(submittedQuery, bggId),
  });
  const attachToPlan = useMutation({ mutationFn: ({ planId, ruleId }: { planId: string; ruleId: string }) => setScheduledGameRule(planId, ruleId) });

  function search() {
    const next = query.trim();
    if (next === submittedQuery) void results.refetch();
    else setSubmittedQuery(next);
  }

  return { query, setQuery, search, results, attachToPlan };
}
