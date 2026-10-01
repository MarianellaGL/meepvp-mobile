import { MeepleSourceOption } from '@decodadev02/meepleui';
import { router, useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { IconButton, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors } from '@/theme';

export default function GameSourcesScreen() {
  const { game, gameId } = useLocalSearchParams<{ game?: string; gameId?: string }>();
  const params = { ...(game ? { game } : {}), ...(gameId ? { gameId } : {}) };

  return <SafeAreaView style={styles.safe} edges={['top']}>
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.top}><IconButton icon="arrow-left" iconColor={colors.forest} onPress={() => router.back()} /><Text style={styles.step}>OTRA FUENTE</Text></View>
      <Text style={styles.title}>Usar otra fuente</Text>
      <Text style={styles.subtitle}>Elegí cómo traer los puntos{game ? ` de ${game}` : ''}.</Text>
      <View style={styles.options}>
        <MeepleSourceOption source="pdf" onPress={() => router.push({ pathname: '/pdf/reader', params })} />
        <MeepleSourceOption source="photo" onPress={() => router.push({ pathname: '/images/reader', params })} />
        <MeepleSourceOption source="manual" onPress={() => router.push({ pathname: '/rules/new', params })} />
      </View>
    </ScrollView>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.canvas },
  content: { padding: 20, gap: 13 },
  top: { flexDirection: 'row', alignItems: 'center', marginLeft: -12 },
  step: { color: colors.orangeInk, fontSize: 10, fontWeight: '800', letterSpacing: 1.4 },
  title: { color: colors.ink, fontSize: 32, fontWeight: '800' },
  subtitle: { color: colors.muted, fontSize: 14, lineHeight: 21, marginBottom: 5 },
  options: { gap: 12 },
});
