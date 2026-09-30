import { useRef, useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { MeepleGameTile, ScoreSkeleton } from '@decodadev02/meepleui';
import { router } from 'expo-router';
import { Text, TextInput } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton as Button } from '@/components/AppButton';
import { AssistStatus } from '@/components/AssistStatus';
import { api, type CollectionGame } from '@/lib/api';
import { useTableScoreStore } from '@/stores/useTableScoreStore';
import { colors } from '@/theme';

export default function GamesScreen() {
  const collection = useTableScoreStore((state) => state.collection);
  const hasRestored = useTableScoreStore((state) => state.hasRestored);
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<CollectionGame[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [searchMessage, setSearchMessage] = useState<string | null>(null);
  const requestVersion = useRef(0);
  const localResults = query.trim() ? collection.filter((game) => game.name.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase())) : collection;
  const displayedGames = searchResults ?? localResults;

  async function searchBGG() {
    const submittedQuery = query.trim();
    if (submittedQuery.length < 2) return;
    const version = ++requestVersion.current;
    setSearching(true);
    setSearchMessage(null);
    try {
      const result = await api.searchGames(submittedQuery);
      if (version !== requestVersion.current) return;
      if (result.status === 'processing') {
        setSearchMessage(`BoardGameGeek está preparando la búsqueda. Reintentá en ${result.retryAfterSeconds ?? 5} segundos.`);
      } else {
        setSearchResults(result.games ?? []);
        if (!result.games?.length) setSearchMessage('No encontramos juegos con ese nombre en BoardGameGeek.');
      }
    } catch (cause) {
      if (version === requestVersion.current) setSearchMessage(cause instanceof Error ? cause.message : 'No pudimos buscar en BoardGameGeek.');
    } finally {
      if (version === requestVersion.current) setSearching(false);
    }
  }

  function changeQuery(value: string) {
    requestVersion.current += 1;
    setQuery(value);
    setSearchResults(null);
    setSearchMessage(null);
    setSearching(false);
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <FlatList
        data={displayedGames}
        keyExtractor={(game) => String(game.bggId)}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={styles.breadcrumb}>
              <Pressable accessibilityRole="link" accessibilityLabel="Volver a Biblioteca" onPress={() => router.navigate('/library')}>
                <Text style={styles.crumbLink}>Biblioteca</Text>
              </Pressable>
              <MaterialCommunityIcons name="chevron-right" size={17} color={colors.muted} />
              <Text style={styles.crumbCurrent}>Listado de juegos</Text>
            </View>
            <Text style={styles.title}>Listado de juegos</Text>
            <Text style={styles.subtitle}>{collection.length} {collection.length === 1 ? 'juego en tu colección' : 'juegos en tu colección'}</Text>
            <TextInput mode="outlined" label="Buscar un juego" value={query} onChangeText={changeQuery} returnKeyType="search" onSubmitEditing={() => searchBGG().catch(() => undefined)} style={styles.searchInput} />
            <Text style={styles.searchHelp}>Al escribir filtrás tu colección. Buscá en BGG para encontrar otros juegos y sus fotos.</Text>
            <Button mode="outlined" icon="magnify" loading={searching} disabled={searching || query.trim().length < 2} onPress={() => searchBGG().catch(() => undefined)}>Buscar en todo BGG</Button>
            {searching && <AssistStatus kind="working" title="Buscando en BGG" description="Consultamos el catálogo y preparamos los resultados para que elijas el juego correcto." />}
            {searchMessage && <AssistStatus title="Búsqueda de BGG" description={searchMessage} />}
            {!searching && searchResults !== null && searchResults.length > 0 && <AssistStatus kind="ready" title={`${searchResults.length} juegos encontrados en BGG`} description="Estos resultados pertenecen al catálogo de BGG. Elegí uno para ver su ficha y crear una planilla." />}
            {query.trim().length > 0 && <Text style={styles.resultLabel}>{searchResults !== null ? 'RESULTADOS DE BGG' : 'EN TU COLECCIÓN'} · {displayedGames.length}</Text>}
            {searchResults !== null && <Button mode="outlined" icon="bookshelf" onPress={() => changeQuery('')}>Volver a mi colección</Button>}
          </View>
        }
        ListEmptyComponent={!hasRestored || searching ? <ScoreSkeleton variant="list" /> : searchResults !== null ? null : query.trim() ?
          <Text style={styles.emptyCopy}>No está en tu colección. Podés buscarlo en todo BGG.</Text> :
          <View style={styles.empty}>
            <MaterialCommunityIcons name="bookshelf" size={36} color={colors.forest} />
            <Text style={styles.emptyTitle}>Todavía no hay juegos</Text>
            <Text style={styles.emptyCopy}>Importá tu colección para ver los juegos acá.</Text>
            <Button mode="contained" onPress={() => router.navigate('/')}>Ir a importar</Button>
          </View>
        }
        renderItem={({ item }) => (
          <MeepleGameTile
            title={item.name}
            imageUrl={item.thumbnailUrl || item.imageUrl}
            detail={`${item.yearPublished || 'Año desconocido'} · ${item.minPlayers ?? '?'}–${item.maxPlayers ?? '?'} jugadores${item.playingTime ? ` · ${item.playingTime} min` : ''}`}
            onPress={() => router.push({ pathname: '/games/[gameId]', params: { gameId: String(item.bggId), name: item.name, ...(item.imageUrl || item.thumbnailUrl ? { imageUrl: item.imageUrl || item.thumbnailUrl } : {}) } })}
          />
        )}
        ListFooterComponent={displayedGames.length > 0 ? <Button mode="contained" onPress={() => router.navigate('/library')}>Volver a la biblioteca</Button> : null}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.canvas },
  content: { gap: 12, padding: 20, paddingBottom: 36 },
  header: { marginBottom: 5 },
  breadcrumb: { alignItems: 'center', flexDirection: 'row', gap: 5, marginBottom: 18, marginTop: 10 },
  crumbLink: { color: colors.forest, fontSize: 13, fontWeight: '700' },
  crumbCurrent: { color: colors.muted, fontSize: 13 },
  title: { color: colors.ink, fontSize: 34, fontWeight: '800', letterSpacing: -1.2 },
  subtitle: { color: colors.muted, fontSize: 15, marginTop: 5 },
  searchInput: { marginTop: 18 },
  searchHelp: { color: colors.muted, fontSize: 13, lineHeight: 19, marginTop: 7 },
  resultLabel: { color: colors.orangeInk, fontSize: 11, fontWeight: '800', letterSpacing: 1, marginTop: 18 },
  empty: { alignItems: 'center', backgroundColor: colors.paper, borderColor: colors.line, borderRadius: 22, borderWidth: 1, gap: 12, marginTop: 15, padding: 28 },
  emptyTitle: { color: colors.ink, fontSize: 18, fontWeight: '800' },
  emptyCopy: { color: colors.muted, textAlign: 'center' },
});
