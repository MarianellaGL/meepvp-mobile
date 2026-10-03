import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import { useImportRulebook } from '@/features/games/useImportRulebook';
import { api } from '@/lib/api';

export function useRulebookCatalog(initialGame = '') {
  const [query, setQuery] = useState(initialGame);
  const [submittedQuery, setSubmittedQuery] = useState(initialGame.trim());
  const [language, setLanguage] = useState<'en' | 'fr'>('en');
  const [searched, setSearched] = useState(Boolean(initialGame.trim()));

  const catalog = useQuery({
    queryKey: ['rulebooks', submittedQuery, language],
    queryFn: () => api.searchRulebooks(submittedQuery, language),
  });
  const importRulebook = useImportRulebook();

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
