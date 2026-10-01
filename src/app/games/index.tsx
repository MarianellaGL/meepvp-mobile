import { MaterialCommunityIcons } from '@expo/vector-icons';
import { MeepleGameTile, MeepleLibraryEntry, MeepleUnifiedSearchResult, ScoreSkeleton } from '@decodadev02/meepleui';
import { router } from 'expo-router';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { Text, TextInput } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton as Button } from '@/components/AppButton';
import { useGameDiscovery } from '@/hooks/useGameDiscovery';
import { buildGameDiscoveryEntries, type GameDiscoveryEntry } from '@/lib/gameDiscovery';
import { useTableScoreStore } from '@/stores/useTableScoreStore';
import { colors } from '@/theme';

export default function GamesScreen() {
  const collection = useTableScoreStore((state) => state.collection);
  const availableRules = useTableScoreStore((state) => state.rules);
  const hasRestored = useTableScoreStore((state) => state.hasRestored);
  const { query, changeQuery, search, searchResult, hasSearched } = useGameDiscovery();
  const searching = hasSearched && searchResult.isFetching;
  const localResults = query.trim() ? collection.filter((game) => game.name.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase())) : collection;
  const entries = buildGameDiscoveryEntries(
    hasSearched ? [...(searchResult.data?.games ?? []), ...localResults] : localResults,
    hasSearched ? availableRules.filter((rule) => rule.gameName.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase())) : [],
    hasSearched ? searchResult.data?.communityRules ?? [] : [],
    hasSearched ? searchResult.data?.rulebooks ?? [] : [],
  );
  const sourceError = searchResult.error || searchResult.data?.unavailableSources.length;

  function openGame(entry: GameDiscoveryEntry) {
    const { game } = entry;
    if (game.bggId > 0) router.push({ pathname: '/games/[gameId]', params: { gameId: String(game.bggId), name: game.name, ...(game.imageUrl || game.thumbnailUrl ? { imageUrl: game.imageUrl || game.thumbnailUrl } : {}) } });
    else if (entry.availableSheets.length) router.push({ pathname: '/sessions/new', params: { ruleId: entry.availableSheets[0].id } });
    else if (entry.communitySheets.length) router.push({ pathname: '/community/rules', params: { game: game.name } });
    else if (entry.rulebooks.length) router.push({ pathname: '/rulebooks', params: { game: game.name } });
    else router.push({ pathname: '/rules/new', params: { game: game.name } });
  }

  return <SafeAreaView style={styles.safe} edges={['top']}>
    <FlatList
      data={entries}
      keyExtractor={(entry) => entry.key}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      ListHeaderComponent={<View style={styles.header}>
        <View style={styles.breadcrumb}>
          <Pressable accessibilityRole="link" accessibilityLabel="Volver a Biblioteca" onPress={() => router.navigate('/library')}><Text style={styles.crumbLink}>Biblioteca</Text></Pressable>
          <MaterialCommunityIcons name="chevron-right" size={17} color={colors.muted} />
          <Text style={styles.crumbCurrent}>Buscar</Text>
        </View>
        <Text style={styles.title}>Buscá un juego</Text>
        <Text style={styles.subtitle}>Encontrá el juego y sus fuentes en una sola búsqueda.</Text>
        <TextInput mode="outlined" label="Buscar un juego" value={query} onChangeText={changeQuery} returnKeyType="search" onSubmitEditing={search} style={styles.searchInput} />
        <Text style={styles.searchHelp}>Buscamos en tu colección, planillas compartidas, reglamentos y BGG.</Text>
        <Button mode="contained" icon="magnify" loading={searching} disabled={searching || query.trim().length < 2} onPress={search}>Buscar juego</Button>
        {searchResult.data?.status === 'processing' && <Text style={styles.searchHelp}>BGG está preparando resultados. Podés reintentar en {searchResult.data.retryAfterSeconds ?? 5} segundos.</Text>}
        {!searching && sourceError && <Text style={styles.searchHelp}>Algunas fuentes no respondieron. Mostramos las que encontramos; podés reintentar la búsqueda.</Text>}
        {(hasSearched || query.trim().length > 0) && <Text style={styles.resultLabel}>{hasSearched ? 'RESULTADOS' : 'EN TU COLECCIÓN'} · {entries.length}</Text>}
      </View>}
      ListEmptyComponent={!hasRestored || searching ? <ScoreSkeleton variant="list" /> : hasSearched ?
        <View style={styles.empty}><Text style={styles.emptyTitle}>Sin coincidencias</Text><Text style={styles.emptyCopy}>Probá otro nombre o usá un PDF, una foto o una planilla manual.</Text><MeepleLibraryEntry title="Usar otra fuente" detail="PDF, foto o crear una planilla" onPress={() => router.push('/games/sources')} /></View> : query.trim() ?
        <Text style={styles.emptyCopy}>No está en tu colección. Tocá Buscar juego para consultar todas las fuentes.</Text> :
        <View style={styles.empty}>
          <MaterialCommunityIcons name="bookshelf" size={36} color={colors.forest} />
          <Text style={styles.emptyTitle}>Todavía no hay juegos</Text>
          <Text style={styles.emptyCopy}>Buscá uno o importá tu colección desde el inicio.</Text>
          <Button mode="text" onPress={() => router.navigate('/')}>Ir a importar</Button>
        </View>}
      renderItem={({ item }) => hasSearched ? <MeepleUnifiedSearchResult
        title={item.game.name}
        edition={item.game.yearPublished ? `${item.game.yearPublished} · juego base` : undefined}
        imageUrl={item.game.thumbnailUrl || item.game.imageUrl}
        sources={item.sources}
        needsReview={item.needsReview}
        onPress={() => openGame(item)}
      /> : <MeepleGameTile
        title={item.game.name}
        imageUrl={item.game.thumbnailUrl || item.game.imageUrl}
        detail={`${item.game.yearPublished || 'Año desconocido'} · ${item.game.minPlayers ?? '?'}–${item.game.maxPlayers ?? '?'} jugadores${item.game.playingTime ? ` · ${item.game.playingTime} min` : ''}`}
        onPress={() => openGame(item)}
      />}
    />
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.canvas },
  content: { gap: 12, padding: 20, paddingBottom: 36 },
  header: { gap: 10, marginBottom: 5 },
  breadcrumb: { alignItems: 'center', flexDirection: 'row', gap: 5, marginBottom: 8, marginTop: 10 },
  crumbLink: { color: colors.forest, fontSize: 13, fontWeight: '700' },
  crumbCurrent: { color: colors.muted, fontSize: 13 },
  title: { color: colors.ink, fontSize: 34, fontWeight: '800', letterSpacing: -1.2 },
  subtitle: { color: colors.muted, fontSize: 15 },
  searchInput: { marginTop: 8 },
  searchHelp: { color: colors.muted, fontSize: 13, lineHeight: 19 },
  resultLabel: { color: colors.orangeInk, fontSize: 11, fontWeight: '800', letterSpacing: 1, marginTop: 12 },
  empty: { alignItems: 'center', backgroundColor: colors.paper, borderColor: colors.line, borderRadius: 22, borderWidth: 1, gap: 12, marginTop: 15, padding: 20 },
  emptyTitle: { color: colors.ink, fontSize: 18, fontWeight: '800' },
  emptyCopy: { color: colors.muted, textAlign: 'center' },
});
