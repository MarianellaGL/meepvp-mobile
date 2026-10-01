import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api';

export function useGameDiscovery() {
  const [query, setQuery] = useState('');
  const [submittedQuery, setSubmittedQuery] = useState<string | null>(null);
  const searchResult = useQuery({
    queryKey: ['bgg-games', submittedQuery],
    queryFn: () => api.searchGames(submittedQuery!),
    enabled: submittedQuery !== null,
    retry: false,
  });
  const communityResult = useQuery({
    queryKey: ['community-rules', submittedQuery],
    queryFn: () => api.searchCommunityRules(submittedQuery!),
    enabled: submittedQuery !== null,
    retry: false,
  });
  const rulebookResult = useQuery({
    queryKey: ['rulebooks', submittedQuery, 'en'],
    queryFn: () => api.searchRulebooks(submittedQuery!, 'en'),
    enabled: submittedQuery !== null,
    retry: false,
  });

  function changeQuery(value: string) {
    setQuery(value);
    setSubmittedQuery(null);
  }

  function search() {
    const next = query.trim();
    if (next.length < 2) return;
    if (next === submittedQuery) {
      void searchResult.refetch();
      void communityResult.refetch();
      void rulebookResult.refetch();
    }
    else setSubmittedQuery(next);
  }

  return { query, changeQuery, search, searchResult, communityResult, rulebookResult, hasSearched: submittedQuery !== null };
}
