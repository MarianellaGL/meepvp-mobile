import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api';
import { queryKeys } from '@/shared/api/queryKeys';
import { useDebouncedValue } from '@/shared/hooks/useDebouncedValue';

const typingPauseMs = 500;
const minLength = 2;

/** Unified search over BGG, community sheets and rulebooks, run as the person types. */
export function useGameSearch(initialQuery = '') {
  const [query, setQuery] = useState(initialQuery);
  // A tapped suggestion searches right away instead of waiting for the pause.
  const [chosen, setChosen] = useState<string | null>(null);
  const settled = useDebouncedValue(query.trim(), typingPauseMs);
  const term = chosen ?? settled;
  const searchResult = useQuery({
    queryKey: queryKeys.discovery(term),
    queryFn: () => api.searchDiscovery(term),
    enabled: term.length >= minLength,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  function changeQuery(value: string) {
    setQuery(value);
    setChosen(null);
  }

  /** Searches a given text, e.g. the "¿Quisiste decir…?" suggestion. */
  function searchFor(value: string) {
    setQuery(value);
    setChosen(value.trim());
  }

  return { query, term, changeQuery, searchFor, searchResult, hasSearched: term.length >= minLength };
}
