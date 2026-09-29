import { useCallback } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { ScoreGameCard } from '@decodadev02/scoreui';
import { router, useFocusEffect } from 'expo-router';
import { IconButton, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/components/AppButton';
import { useTableScoreStore } from '@/stores/useTableScoreStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { colors } from '@/theme';
import { formatPlayedDuration } from '@/lib/gameDuration';

export default function HistoryScreen() {
  const session = useTableScoreStore((state) => state.session);
  const rules = useTableScoreStore((state) => state.rules);
  const account = useAuthStore((state) => state.user);
  const accountSessions = useAuthStore((state) => state.sessions);
  const refreshAccount = useAuthStore((state) => state.refresh);
  useFocusEffect(useCallback(() => { if (account) refreshAccount().catch(() => undefined); }, [account, refreshAccount]));
  const finished = session?.status === 'finished' ? session : null;
  const rule = rules.find((item) => item.id === finished?.ruleId);
  const bestScore = finished?.totals.reduce<number | null>((best, player) => {
    if (best === null) return player.total;
    return rule?.winCondition === 'lowest_total' ? Math.min(best, player.total) : Math.max(best, player.total);
  }, null);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.topRow}>
          <IconButton icon="arrow-left" accessibilityLabel="Volver al perfil" onPress={() => router.canGoBack() ? router.back() : router.replace('/profile')} />
          <Text style={styles.eyebrow}>NOCHES DE JUEGOS</Text>
        </View>
        <Text style={styles.title}>Historial</Text>
        <Text style={styles.subtitle}>{account ? 'Tus partidas terminadas y estadísticas de esta cuenta.' : 'Tu última partida terminada, guardada en este dispositivo.'}</Text>
        {account ? accountSessions.filter((game) => game.status === 'finished').map((game) => {
          const myScore = game.totals.find((total) => total.playerId === game.myPlayerId)?.total ?? 0;
          const winners = game.winners.map((winner) => game.players.find((player) => player.id === winner.playerId)?.name ?? 'Jugador');
          return <View key={game.id} style={styles.card}>
            <ScoreGameCard title={game.gameName} detail={`${game.players.length} jugadores · ${formatPlayedDuration(game.durationSeconds)} · ${new Date(game.finishedAt ?? game.lastModified).toLocaleString('es-AR')}`} score={myScore} label="TU PUNTAJE" featured />
            <Text style={styles.winner}>{winners.length === 1 ? `Ganó ${winners[0]}` : `Empate: ${winners.join(', ')}`}</Text>
            <AppButton mode="outlined" onPress={() => router.push(`/sessions/${game.id}`)}>Ver puntuación</AppButton>
          </View>;
        }) : finished ? (
          <View style={styles.card}>
            <ScoreGameCard title={rule?.gameName ?? 'Partida'} detail={`${finished.players.length} jugadores · ${formatPlayedDuration(finished.durationSeconds)} · ${new Date(finished.finishedAt ?? finished.lastModified).toLocaleString('es-AR')}`} score={bestScore ?? 0} label="ÚLTIMA PARTIDA" featured />
            <AppButton mode="outlined" onPress={() => router.push(`/sessions/${finished.id}`)}>Ver puntuación</AppButton>
          </View>
        ) : (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>Todavía no hay partidas terminadas</Text>
            <Text style={styles.subtitle}>Cuando termines una partida, vas a poder volver a verla acá.</Text>
            <AppButton mode="contained" onPress={() => router.navigate('/')}>Ir al inicio</AppButton>
          </View>
        )}
        {account && accountSessions.every((game) => game.status !== 'finished') && <Text style={styles.subtitle}>Todavía no tenés partidas terminadas en esta cuenta.</Text>}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.canvas },
  content: { gap: 14, padding: 20, paddingBottom: 36 },
  topRow: { flexDirection: 'row', alignItems: 'center', marginLeft: -12 },
  eyebrow: { color: colors.forest, fontSize: 10, fontWeight: '800', letterSpacing: 1.5, marginTop: 10 },
  title: { color: colors.ink, fontSize: 34, fontWeight: '800' },
  subtitle: { color: colors.muted, fontSize: 14, lineHeight: 21 },
  card: { gap: 14, marginTop: 16 },
  empty: { backgroundColor: colors.paper, borderColor: colors.line, borderRadius: 18, borderWidth: 1, gap: 14, marginTop: 16, padding: 22 },
  emptyTitle: { color: colors.ink, fontSize: 18, fontWeight: '800' },
  winner: { color: colors.forest, fontSize: 14, fontWeight: '800' },
});
