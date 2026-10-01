import { useCallback, useState } from 'react';
import { MeepleGameTile, MeepleLibraryEntry, ScoreSkeleton } from '@decodadev02/meepleui';
import { router, useFocusEffect } from 'expo-router';
import { FlatList, StyleSheet, View } from 'react-native';
import { IconButton, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTableScoreStore } from '@/stores/useTableScoreStore';
import { colors } from '@/theme';

export default function LibraryScreen() {
  const collection = useTableScoreStore((state) => state.collection);
  const rules = useTableScoreStore((state) => state.rules);
  const savedPDFs = useTableScoreStore((state) => state.savedPDFs);
  const hasRestored = useTableScoreStore((state) => state.hasRestored);
  const loadRules = useTableScoreStore((state) => state.loadRules);
  const [loadingRules, setLoadingRules] = useState(false);
  const [rulesError, setRulesError] = useState<string | null>(null);

  const refreshRules = useCallback(async () => {
    setLoadingRules(true);
    setRulesError(null);
    try { await loadRules(); }
    catch (cause) { setRulesError(cause instanceof Error ? cause.message : 'No pudimos cargar las planillas.'); }
    finally { setLoadingRules(false); }
  }, [loadRules]);

  useFocusEffect(useCallback(() => { void refreshRules(); }, [refreshRules]));

  return <SafeAreaView style={styles.safe} edges={['top']}>
    <FlatList
      data={collection}
      keyExtractor={(game) => String(game.bggId)}
      contentContainerStyle={styles.content}
      ListHeaderComponent={<View style={styles.header}>
        <Text style={styles.eyebrow}>TU BIBLIOTECA</Text>
        <Text style={styles.title}>Juegos y planillas</Text>
        <Text style={styles.subtitle}>Elegí un juego para ver sus fuentes o retomá una planilla guardada.</Text>
        <MeepleLibraryEntry title="Buscar un juego" detail="Tu colección y otras fuentes" onPress={() => router.push('/games')} />
        <MeepleLibraryEntry title="Crear una planilla" detail="Prepará una planilla para jugar" onPress={() => router.push('/rules/new')} />

        <View style={styles.sectionHeading}>
          <View><Text style={styles.sectionLabel}>MIS PLANILLAS</Text><Text style={styles.count}>{rules.length} guardadas</Text></View>
          <IconButton icon="refresh" iconColor={colors.forest} disabled={loadingRules} accessibilityLabel="Actualizar planillas" onPress={() => void refreshRules()} />
        </View>
        {rulesError && <Text style={styles.error}>{rulesError}</Text>}
        {loadingRules && !rules.length && <ScoreSkeleton variant="list" />}
        {!loadingRules && !rules.length && <Text style={styles.emptyCopy}>Todavía no hay planillas guardadas.</Text>}
        {rules.map((rule) => <MeepleLibraryEntry key={rule.id} title={rule.gameName} detail={`${rule.name} · ${rule.fields.length} campos`} onPress={() => router.push({ pathname: '/sessions/new', params: { ruleId: rule.id } })} />)}

        {!!savedPDFs.length && <View style={styles.savedSection}>
          <Text style={styles.sectionLabel}>REGLAMENTOS GUARDADOS</Text>
          {savedPDFs.map((pdf) => <MeepleLibraryEntry key={pdf.gameId ?? pdf.gameName} title={pdf.gameName} detail={pdf.document.fileName} onPress={() => router.push({ pathname: '/pdf/reader', params: { game: pdf.gameName, ...(pdf.gameId ? { gameId: String(pdf.gameId) } : {}) } })} />)}
        </View>}

        <View style={styles.sectionHeading}><View><Text style={styles.sectionLabel}>MIS JUEGOS</Text><Text style={styles.count}>{collection.length} en tu colección</Text></View></View>
      </View>}
      ListEmptyComponent={!hasRestored ? <ScoreSkeleton variant="list" /> : <Text style={styles.emptyCopy}>Tu colección está vacía. Buscá un juego o importá tus juegos desde Inicio.</Text>}
      renderItem={({ item }) => {
        const hasSheet = rules.some((rule) => rule.bggId === item.bggId || (!rule.bggId && rule.gameName.trim().toLocaleLowerCase() === item.name.trim().toLocaleLowerCase()));
        return <MeepleGameTile
          title={item.name}
          imageUrl={item.thumbnailUrl || item.imageUrl}
          detail={`${item.minPlayers ?? '?'}–${item.maxPlayers ?? '?'} jugadores · ${hasSheet ? 'Planilla lista' : 'Sin planilla'}`}
          onPress={() => router.push({ pathname: '/games/[gameId]', params: { gameId: String(item.bggId), name: item.name } })}
        />;
      }}
    />
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.canvas },
  content: { gap: 12, padding: 20, paddingBottom: 36 },
  header: { gap: 12 },
  eyebrow: { color: colors.orangeInk, fontSize: 10, fontWeight: '800', letterSpacing: 1.5, marginTop: 10 },
  title: { color: colors.ink, fontSize: 34, fontWeight: '800', letterSpacing: -1.2 },
  subtitle: { color: colors.muted, fontSize: 15, lineHeight: 21, marginBottom: 4 },
  sectionHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 15 },
  sectionLabel: { color: colors.orangeInk, fontSize: 11, fontWeight: '800', letterSpacing: 1.2 },
  count: { color: colors.muted, fontSize: 12, marginTop: 3 },
  savedSection: { gap: 12, marginTop: 12 },
  emptyCopy: { color: colors.muted, fontSize: 13, lineHeight: 19 },
  error: { color: colors.error, fontSize: 13 },
});
