import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ScoreSkeleton } from '@decodadev02/scoreui';
import { router } from 'expo-router';
import { Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton as Button } from '@/components/AppButton';
import { useTableScoreStore } from '@/stores/useTableScoreStore';
import { colors } from '@/theme';

export default function GamesScreen() {
  const collection = useTableScoreStore((state) => state.collection);
  const hasRestored = useTableScoreStore((state) => state.hasRestored);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <FlatList
        data={collection}
        keyExtractor={(game) => String(game.bggId)}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={styles.breadcrumb}>
              <Pressable accessibilityRole="link" accessibilityLabel="Volver a Perfil" onPress={() => router.navigate('/profile')}>
                <Text style={styles.crumbLink}>Perfil</Text>
              </Pressable>
              <MaterialCommunityIcons name="chevron-right" size={17} color={colors.muted} />
              <Text style={styles.crumbCurrent}>Listado de juegos</Text>
            </View>
            <Text style={styles.title}>Listado de juegos</Text>
            <Text style={styles.subtitle}>{collection.length} {collection.length === 1 ? 'juego en tu colección' : 'juegos en tu colección'}</Text>
          </View>
        }
        ListEmptyComponent={!hasRestored ? <ScoreSkeleton variant="list" /> :
          <View style={styles.empty}>
            <MaterialCommunityIcons name="bookshelf" size={36} color={colors.forest} />
            <Text style={styles.emptyTitle}>Todavía no hay juegos</Text>
            <Text style={styles.emptyCopy}>Importá tu colección para ver los juegos acá.</Text>
            <Button mode="contained" onPress={() => router.navigate('/')}>Ir a importar</Button>
          </View>
        }
        renderItem={({ item, index }) => (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Ver ${item.name}`}
            onPress={() => router.push({ pathname: '/games/[gameId]', params: { gameId: String(item.bggId), name: item.name } })}
            style={styles.gameCard}
          >
            <View style={[styles.gameIcon, { backgroundColor: index % 2 === 0 ? colors.mint : colors.orangePale }]}>
              <MaterialCommunityIcons name="dice-multiple-outline" size={27} color={index % 2 === 0 ? colors.forest : colors.orangeInk} />
            </View>
            <View style={styles.gameBody}>
              <Text style={styles.gameName} numberOfLines={2}>{item.name}</Text>
              <Text style={styles.gameMeta}>{item.yearPublished || 'Año desconocido'} · {item.minPlayers ?? '?'}–{item.maxPlayers ?? '?'} jugadores</Text>
              {!!item.playingTime && <Text style={styles.gameMeta}>{item.playingTime} min</Text>}
            </View>
            <MaterialCommunityIcons name="chevron-right" size={22} color={colors.muted} />
          </Pressable>
        )}
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
  gameCard: { alignItems: 'center', backgroundColor: colors.paper, borderColor: colors.line, borderRadius: 18, borderWidth: 1, flexDirection: 'row', gap: 13, padding: 12 },
  gameIcon: { alignItems: 'center', borderRadius: 13, height: 62, justifyContent: 'center', width: 62 },
  gameBody: { flex: 1 },
  gameName: { color: colors.ink, fontSize: 16, fontWeight: '700' },
  gameMeta: { color: colors.muted, fontSize: 12, marginTop: 3 },
  empty: { alignItems: 'center', backgroundColor: colors.paper, borderColor: colors.line, borderRadius: 22, borderWidth: 1, gap: 12, marginTop: 15, padding: 28 },
  emptyTitle: { color: colors.ink, fontSize: 18, fontWeight: '800' },
  emptyCopy: { color: colors.muted, textAlign: 'center' },
});
