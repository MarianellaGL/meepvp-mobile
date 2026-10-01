import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api';

export function useGameDiscovery() {
  const [query, setQuery] = useState('');
  const [submittedQuery, setSubmittedQuery] = useState<string | null>(null);
  const searchResult = useQuery({
    queryKey: ['game-discovery', submittedQuery],
    queryFn: () => api.searchDiscovery(submittedQuery!),
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
    }
    else setSubmittedQuery(next);
  }

  return { query, changeQuery, search, searchResult, hasSearched: submittedQuery !== null };
}
