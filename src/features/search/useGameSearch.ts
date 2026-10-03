import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api';
import { queryKeys } from '@/shared/api/queryKeys';

/** Unified search over BGG, community sheets and rulebooks. Searches only on submit. */
export function useGameSearch(initialQuery = '') {
  const initial = initialQuery.trim();
  const [query, setQuery] = useState(initial);
  const [submittedQuery, setSubmittedQuery] = useState<string | null>(initial.length >= 2 ? initial : null);
  const searchResult = useQuery({
    queryKey: queryKeys.discovery(submittedQuery ?? ''),
    queryFn: () => api.searchDiscovery(submittedQuery!),
    enabled: submittedQuery !== null,
    retry: false,
  });

  function changeQuery(value: string) {
    setQuery(value);
    setSubmittedQuery(null);
  }

  function search() {
    searchFor(query);
  }

  /** Searches a given text, e.g. the "¿Quisiste decir…?" suggestion. */
  function searchFor(value: string) {
    const next = value.trim();
    if (next.length < 2) return;
    setQuery(next);
    if (next === submittedQuery) void searchResult.refetch();
    else setSubmittedQuery(next);
  }

  return { query, changeQuery, search, searchFor, searchResult, hasSearched: submittedQuery !== null };
}
