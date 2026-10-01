import { MeepleSourceOption } from '@decodadev02/meepleui';
import { router, useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { IconButton, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, tokens } from '@/theme';

export default function GameSourcesScreen() {
  const { game, gameId, flow } = useLocalSearchParams<{ game?: string; gameId?: string; flow?: string }>();
  const params = { ...(game ? { game } : {}), ...(gameId ? { gameId } : {}) };
  const setup = flow === 'setup';

  return <SafeAreaView style={styles.safe} edges={['top']}>
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.top}><IconButton icon="arrow-left" iconColor={colors.forest} onPress={() => router.back()} /><Text style={styles.step}>{setup ? 'PARTIDA · PLANILLA' : 'TU BIBLIOTECA'}</Text></View>
      <Text style={styles.title}>Usar otra fuente</Text>
      <Text style={styles.subtitle}>Elegí cómo preparar los puntos{game ? ` de ${game}` : ''}.</Text>
      {setup && <View accessibilityLabel="Paso 3 de 5" style={styles.progressTrack}><View style={styles.progressFill} /></View>}
      <View style={styles.options}>
        <MeepleSourceOption source="pdf" selected onPress={() => router.push({ pathname: '/pdf/reader', params })} />
        <MeepleSourceOption source="photo" onPress={() => router.push({ pathname: '/images/reader', params })} />
        <MeepleSourceOption source="manual" onPress={() => router.push({ pathname: '/rules/new', params })} />
      </View>
    </ScrollView>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.canvas },
  content: { padding: 24, gap: 13 },
  top: { flexDirection: 'row', alignItems: 'center', marginLeft: -12 },
  step: { color: colors.orangeInk, fontSize: 10, fontWeight: '800', letterSpacing: 1.4 },
  title: { color: colors.ink, fontFamily: tokens.font.heading, fontSize: 27, lineHeight: 35 },
  subtitle: { color: colors.muted, fontSize: 14, lineHeight: 21, marginBottom: 5 },
  options: { gap: 12 },
  progressTrack: { backgroundColor: colors.line, borderRadius: 4, height: 5, marginTop: 13, marginBottom: 8, overflow: 'hidden' },
  progressFill: { backgroundColor: colors.orangeInk, height: '100%', width: '60%' },
});
