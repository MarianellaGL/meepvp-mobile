import { MeepleGameTile, ScoreButton, ScoreSkeleton, ScoreTextField } from '@decodadev02/meepleui';
import { router, useLocalSearchParams } from 'expo-router';

import type { CollectionGame } from '@/lib/api';
import { groupSuggestions, normalizeName, type PlayableSuggestion } from '@/features/search/suggestions';
import { useGameSearch } from '@/features/search/useGameSearch';
import { Hint, Section } from '@/shared/ui/Section';
import { Screen } from '@/shared/ui/Screen';
import { useTableScoreStore } from '@/stores/useTableScoreStore';

export default function SearchScreen() {
  const { flow, query: initialQuery } = useLocalSearchParams<{ flow?: string; query?: string }>();
  const setup = flow === 'setup';
  const collection = useTableScoreStore((state) => state.collection);
  const deviceSheets = useTableScoreStore((state) => state.rules);
  const { query, term, changeQuery, searchFor, searchResult, hasSearched } = useGameSearch(initialQuery);
  const data = searchResult.data;
  const loading = hasSearched && searchResult.isFetching && !data;
  // A corrected title also finds the games and sheets saved on this device.
  const matchTerm = data?.searchedAs ?? term;
  const owned = matchTerm ? collection.filter((game) => normalizeName(game.name).includes(normalizeName(matchTerm))) : [];
  const { playable, games } = groupSuggestions(matchTerm, {
    deviceSheets: hasSearched ? deviceSheets : [],
    communitySheets: data?.communityRules ?? [],
    games: [...owned, ...(data?.games ?? [])],
    rulebooks: data?.rulebooks ?? [],
  });
  const cover = (bggId?: number) => {
    const game = [...owned, ...(data?.games ?? [])].find((item) => item.bggId === bggId);
    return game?.thumbnailUrl || game?.imageUrl;
  };
  const noResults = hasSearched && !!data && !searchResult.isFetching && !playable.length && !games.length && data.status !== 'processing';

  function openGame(game: Pick<CollectionGame, 'bggId' | 'name'>) {
    router.push({ pathname: '/games/[gameId]', params: { gameId: String(game.bggId), name: game.name, ...(cover(game.bggId) ? { imageUrl: cover(game.bggId) } : {}), ...(setup ? { flow: 'setup' } : {}) } });
  }

  function openPlayable(entry: PlayableSuggestion) {
    if (entry.bggId) openGame({ bggId: entry.bggId, name: entry.gameName });
    else router.push({ pathname: '/sessions/new', params: { ruleId: entry.sheets[0].id } });
  }

  return <Screen eyebrow={setup ? 'PARTIDA · PLANILLA' : 'BIBLIOTECA'} title="Buscá un juego" tab={setup ? undefined : 'library'} onBack={setup ? () => router.back() : undefined}>
    <ScoreTextField label="Juego" placeholder="Covenant, Everdell…" value={query} onChangeText={changeQuery} returnKeyType="search" onSubmitEditing={() => searchFor(query)} />

    {!hasSearched && <Hint>Escribí el nombre: te mostramos primero los juegos que ya tienen planilla.</Hint>}
    {data?.searchedAs && <Hint>Mostrando resultados para «{data.searchedAs}».</Hint>}
    {data?.status === 'processing' && <Hint>BGG está preparando resultados. Probá de nuevo en {data.retryAfterSeconds ?? 5} segundos.</Hint>}
    {searchResult.error && <Hint tone="error">{searchResult.error.message}</Hint>}
    {!!data?.unavailableSources.length && <Hint>Algunas fuentes no respondieron; mostramos lo que encontramos.</Hint>}
    {loading && <ScoreSkeleton variant="list" />}

    {playable.length > 0 && <Section label="CON PLANILLA">
      {playable.map((entry) => <MeepleGameTile
        key={entry.key}
        title={entry.gameName}
        detail={`${entry.sheets.length} ${entry.sheets.length === 1 ? 'planilla' : 'planillas'}${entry.fromCommunity ? ' de la comunidad' : ''} · Lista para jugar`}
        imageUrl={cover(entry.bggId)}
        onPress={() => openPlayable(entry)}
      />)}
    </Section>}

    {games.length > 0 && <Section label="JUEGOS">
      {games.map(({ game, hasRulebook }) => <MeepleGameTile
        key={`${game.bggId}-${game.name}`}
        title={game.name}
        detail={[game.yearPublished, hasRulebook ? 'Reglamento disponible' : undefined].filter(Boolean).join(' · ') || undefined}
        imageUrl={game.thumbnailUrl || game.imageUrl}
        onPress={() => openGame(game)}
      />)}
    </Section>}

    {noResults && <Section label="SIN RESULTADOS">
      <Hint>No encontramos «{term}».</Hint>
      {data?.suggestedQuery && <ScoreButton label={`¿Quisiste decir «${data.suggestedQuery}»?`} variant="tertiary" onPress={() => searchFor(data.suggestedQuery!)} />}
      <ScoreButton label="Crear la planilla igual" variant="secondary" icon="plus" onPress={() => router.push({ pathname: '/rules/new', params: { game: term, ...(setup ? { flow: 'setup' } : {}) } })} />
    </Section>}
  </Screen>;
}
