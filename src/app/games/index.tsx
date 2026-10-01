import { MeepleUnifiedSearchResult, ScoreSkeleton } from '@decodadev02/meepleui';
import { router, useLocalSearchParams } from 'expo-router';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { Text, TextInput } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton as Button } from '@/components/AppButton';
import { AppBottomNav, type AppTab } from '@/components/AppBottomNav';
import { useGameDiscovery } from '@/hooks/useGameDiscovery';
import { buildGameDiscoveryEntries, type GameDiscoveryEntry } from '@/lib/gameDiscovery';
import { useTableScoreStore } from '@/stores/useTableScoreStore';
import { colors, tokens } from '@/theme';

export default function GamesScreen() {
  const { flow } = useLocalSearchParams<{ flow?: string }>();
  const setup = flow === 'setup';
  const collection = useTableScoreStore((state) => state.collection);
  const availableRules = useTableScoreStore((state) => state.rules);
  const hasRestored = useTableScoreStore((state) => state.hasRestored);
  const { query, changeQuery, search, searchResult, hasSearched } = useGameDiscovery();
  const searching = hasSearched && (searchResult.isPending || searchResult.isFetching);
  const localResults = collection.filter((game) => game.name.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()));
  const entries = hasSearched ? buildGameDiscoveryEntries(
    [...(searchResult.data?.games ?? []), ...localResults],
    availableRules.filter((rule) => rule.gameName.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase())),
    searchResult.data?.communityRules ?? [],
    searchResult.data?.rulebooks ?? [],
  ) : [];
  const noResults = hasSearched && !searching && !searchResult.error && entries.length === 0 && searchResult.data?.status !== 'processing';
  const sourceError = searchResult.error || searchResult.data?.unavailableSources.length;

  function openGame(entry: GameDiscoveryEntry) {
    const { game } = entry;
    if (game.bggId > 0) router.push({ pathname: '/games/[gameId]', params: { gameId: String(game.bggId), name: game.name, ...(setup ? { flow: 'setup' } : {}), ...(game.imageUrl || game.thumbnailUrl ? { imageUrl: game.imageUrl || game.thumbnailUrl } : {}) } });
    else if (entry.availableSheets.length) router.push({ pathname: '/sessions/new', params: { ruleId: entry.availableSheets[0].id } });
    else if (entry.communitySheets.length) router.push({ pathname: '/community/rules', params: { game: game.name } });
    else if (entry.rulebooks.length) router.push({ pathname: '/rulebooks', params: { game: game.name } });
    else router.push({ pathname: '/games/sources', params: { game: game.name, ...(setup ? { flow: 'setup' } : {}) } });
  }

  function selectTab(tab: AppTab) {
    if (tab === 'home') router.navigate('/');
    else if (tab === 'library') router.navigate('/library');
    else if (tab === 'profile') router.navigate('/profile');
    else if (tab === 'new-game') router.push('/sessions/new');
    else router.navigate('/tables');
  }

  return <SafeAreaView style={styles.safe} edges={['top']}>
    <FlatList
      data={searching ? [] : entries}
      keyExtractor={(entry) => entry.key}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      ListHeaderComponent={<View style={styles.header}>
        <Text style={styles.eyebrow}>{setup ? 'PARTIDA · PLANILLA' : 'TU BIBLIOTECA'}</Text>
        <Text style={styles.title}>{noResults ? 'Sin coincidencias' : searching ? `Buscando ${query.trim()}` : entries.length === 1 ? entries[0].game.name : 'Buscá un juego'}</Text>
        <Text style={styles.subtitle}>{noResults ? 'No encontramos ese juego en las fuentes.' : searching ? 'Estamos consultando juegos, planillas y reglamentos.' : entries.length ? 'Un juego, todas sus opciones.' : 'Encontrá el juego y sus fuentes en una sola búsqueda.'}</Text>
        {setup && <View accessibilityLabel="Paso 3 de 5" style={styles.progressTrack}><View style={styles.progressFill} /></View>}
        <TextInput mode="outlined" label="Buscar un juego" value={query} onChangeText={changeQuery} returnKeyType="search" onSubmitEditing={search} style={styles.searchInput} />
        <Text style={styles.searchHelp}>{hasSearched ? 'BGG, planillas y reglamentos consultados.' : 'Buscamos en tu colección, planillas, reglamentos y BGG.'}</Text>
        {!setup && <Button mode="contained" icon="magnify" loading={searching} disabled={searching || query.trim().length < 2} onPress={search}>Buscar juego</Button>}
        {searchResult.data?.status === 'processing' && <Text style={styles.searchHelp}>BGG está preparando resultados. Podés reintentar en {searchResult.data.retryAfterSeconds ?? 5} segundos.</Text>}
        {!searching && sourceError && <Text style={styles.searchHelp}>{searchResult.error ? 'No pudimos completar la búsqueda. Reintentá para consultar las fuentes.' : 'Algunas fuentes no respondieron. Mostramos las que encontramos; podés reintentar la búsqueda.'}</Text>}
      </View>}
      ListEmptyComponent={!hasRestored || searching ? <ScoreSkeleton variant="list" /> : noResults ? <View style={styles.empty}><Text style={styles.emptyTitle}>Probá con otro nombre</Text><Text style={styles.emptyCopy}>También podés usar un PDF, una foto o armar la planilla.</Text></View> : null}
      renderItem={({ item }) => <MeepleUnifiedSearchResult
        title={item.game.name}
        edition={item.game.yearPublished ? `${item.game.yearPublished} · juego base` : undefined}
        imageUrl={item.game.thumbnailUrl || item.game.imageUrl}
        sources={item.sources}
        needsReview={item.needsReview}
        onPress={() => openGame(item)}
      />}
      ListFooterComponent={<View style={styles.footer}>
        {noResults && <Pressable accessibilityRole="link" onPress={() => changeQuery('')}><Text style={styles.link}>Buscar otro nombre →</Text></Pressable>}
        <Pressable accessibilityRole="link" onPress={() => router.push({ pathname: '/games/sources', params: { ...(query.trim() ? { game: query.trim() } : {}), ...(setup ? { flow: 'setup' } : {}) } })}><Text style={styles.link}>Usar otra fuente →</Text></Pressable>
      </View>}
    />
    {setup ? !hasSearched && <View style={styles.bottomAction}><Button mode="contained" icon="magnify" disabled={query.trim().length < 2} onPress={search}>Buscar juego</Button></View> : <AppBottomNav active="library" onSelect={selectTab} />}
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.canvas },
  content: { gap: 12, padding: 24, paddingBottom: 36 },
  header: { gap: 12, marginBottom: 8, paddingTop: 10 },
  eyebrow: { color: colors.orangeInk, fontSize: 10, fontWeight: '800', letterSpacing: 1.5 },
  title: { color: colors.ink, fontFamily: tokens.font.heading, fontSize: 27, lineHeight: 35 },
  subtitle: { color: colors.muted, fontSize: 14, lineHeight: 21 },
  progressTrack: { backgroundColor: colors.line, borderRadius: 4, height: 5, marginTop: 13, overflow: 'hidden' },
  progressFill: { backgroundColor: colors.orangeInk, height: '100%', width: '60%' },
  searchInput: { marginTop: 12 },
  searchHelp: { color: colors.muted, fontSize: 13, lineHeight: 19 },
  empty: { backgroundColor: colors.paper, borderColor: colors.line, borderRadius: 16, borderWidth: 1, gap: 8, padding: 18 },
  emptyTitle: { color: colors.ink, fontSize: 18, fontWeight: '800' },
  emptyCopy: { color: colors.muted, fontSize: 13, lineHeight: 19 },
  footer: { gap: 16, paddingTop: 16 },
  link: { color: colors.orangeInk, fontSize: 14, fontWeight: '700' },
  bottomAction: { backgroundColor: colors.canvas, paddingHorizontal: 24, paddingVertical: 14 },
});
