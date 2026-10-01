import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';

import { api, type Rulebook } from '@/lib/api';

export function useRulebookCatalog(initialGame = '') {
  const [query, setQuery] = useState(initialGame);
  const [submittedQuery, setSubmittedQuery] = useState(initialGame.trim());
  const [language, setLanguage] = useState<'en' | 'fr'>('en');
  const [searched, setSearched] = useState(Boolean(initialGame.trim()));

  const catalog = useQuery({
    queryKey: ['rulebooks', submittedQuery, language],
    queryFn: () => api.searchRulebooks(submittedQuery, language),
  });
  const importRulebook = useMutation({ mutationFn: (book: Rulebook) => api.extractRulebook(book.id) });

  function search() {
    const next = query.trim();
    setSearched(Boolean(next));
    importRulebook.reset();
    if (next === submittedQuery) void catalog.refetch();
    else setSubmittedQuery(next);
  }

  function changeLanguage(value: 'en' | 'fr') {
    setLanguage(value);
    setSubmittedQuery(query.trim());
    setSearched(Boolean(query.trim()));
    importRulebook.reset();
  }

  return { query, setQuery, language, changeLanguage, searched, search, catalog, importRulebook };
}
