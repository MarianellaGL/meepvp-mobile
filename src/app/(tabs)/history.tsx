import { ScrollView, StyleSheet, View } from 'react-native';
import { ScoreGameCard } from '@decodadev02/scoreui';
import { router } from 'expo-router';
import { Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/components/AppButton';
import { useTableScoreStore } from '@/stores/useTableScoreStore';
import { colors } from '@/theme';

export default function HistoryScreen() {
  const session = useTableScoreStore((state) => state.session);
  const rules = useTableScoreStore((state) => state.rules);
  const finished = session?.status === 'finished' ? session : null;
  const rule = rules.find((item) => item.id === finished?.ruleId);
  const bestScore = finished?.totals.reduce<number | null>((best, player) => {
    if (best === null) return player.total;
    return rule?.winCondition === 'lowest_total' ? Math.min(best, player.total) : Math.max(best, player.total);
  }, null);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.eyebrow}>GAME NIGHTS</Text>
        <Text style={styles.title}>Historial</Text>
        <Text style={styles.subtitle}>Tu última partida terminada, con los puntos guardados.</Text>
        {finished ? (
          <View style={styles.card}>
            <ScoreGameCard title={rule?.gameName ?? 'Partida'} detail={`${finished.players.length} jugadores`} score={bestScore ?? 0} label="ÚLTIMA PARTIDA" featured />
            <AppButton mode="outlined" onPress={() => router.push(`/sessions/${finished.id}`)}>Ver puntuación</AppButton>
          </View>
        ) : (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>Todavía no hay partidas terminadas</Text>
            <Text style={styles.subtitle}>Cuando termines una partida, vas a poder volver a verla acá.</Text>
            <AppButton mode="contained" onPress={() => router.navigate('/')}>Ir al inicio</AppButton>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.canvas },
  content: { gap: 14, padding: 20, paddingBottom: 36 },
  eyebrow: { color: colors.forest, fontSize: 10, fontWeight: '800', letterSpacing: 1.5, marginTop: 10 },
  title: { color: colors.ink, fontSize: 34, fontWeight: '800' },
  subtitle: { color: colors.muted, fontSize: 14, lineHeight: 21 },
  card: { gap: 14, marginTop: 16 },
  empty: { backgroundColor: colors.paper, borderColor: colors.line, borderRadius: 18, borderWidth: 1, gap: 14, marginTop: 16, padding: 22 },
  emptyTitle: { color: colors.ink, fontSize: 18, fontWeight: '800' },
});
