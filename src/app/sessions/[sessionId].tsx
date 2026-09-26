import { useEffect } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, Button, Card, Checkbox, IconButton, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTableScoreStore } from '@/stores/useTableScoreStore';

export default function ScoringScreen() {
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const { session, rules, loadRules, updateScore, finishSession, error } = useTableScoreStore();
  useEffect(() => { loadRules().catch(() => undefined); }, [loadRules]);
  if (!session || session.id !== sessionId) return <SafeAreaView style={styles.loading}><ActivityIndicator size="large" /><Text>Loading game…</Text></SafeAreaView>;
  const rule = rules.find((candidate) => candidate.id === session.ruleId);
  if (!rule) return <SafeAreaView style={styles.loading}><ActivityIndicator size="large" /></SafeAreaView>;
  return <SafeAreaView style={styles.safeArea} edges={['top']}><ScrollView contentContainerStyle={styles.content}>
    <Text variant="headlineSmall">{rule.gameName}</Text><Text variant="bodyLarge" style={styles.subtitle}>{rule.name}</Text>
    {session.players.map((player) => { const total = session.totals.find((item) => item.playerId === player.id)?.total ?? 0; return <Card key={player.id} mode="contained"><Card.Content><View style={styles.playerHeader}><Text variant="titleLarge">{player.name}</Text><Text variant="headlineSmall">{total}</Text></View>{rule.fields.map((field) => { const value = session.values[player.id]?.[field.id] ?? 0; if (field.kind === 'checkbox') return <View key={field.id} style={styles.scoreRow}><View><Text variant="titleSmall">{field.name}</Text><Text variant="bodySmall">{field.pointsPerUnit > 0 ? '+' : ''}{field.pointsPerUnit} points</Text></View><Checkbox status={value > 0 ? 'checked' : 'unchecked'} onPress={() => updateScore(player.id, field.id, value > 0 ? 0 : 1)} /></View>; return <View key={field.id} style={styles.scoreRow}><View><Text variant="titleSmall">{field.name}</Text>{field.kind !== 'manual' && <Text variant="bodySmall">{field.pointsPerUnit > 0 ? '+' : ''}{field.pointsPerUnit} per unit</Text>}</View><View style={styles.counter}><IconButton icon="minus" onPress={() => updateScore(player.id, field.id, value - 1)} /><Text variant="titleLarge">{value}</Text><IconButton icon="plus" onPress={() => updateScore(player.id, field.id, value + 1)} /></View></View>; })}</Card.Content></Card>; })}
    {error && <Text style={styles.error}>{error}</Text>}
    <Button mode="contained-tonal" icon="check" disabled={session.status === 'finished'} onPress={() => finishSession().catch(() => undefined)}>{session.status === 'finished' ? 'Game finished' : 'Finish game'}</Button>
  </ScrollView></SafeAreaView>;
}
const styles = StyleSheet.create({ safeArea: { flex: 1, backgroundColor: '#FFFBFE' }, loading: { alignItems: 'center', flex: 1, gap: 16, justifyContent: 'center' }, content: { gap: 14, padding: 20 }, subtitle: { color: '#625B71' }, playerHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' }, scoreRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 }, counter: { alignItems: 'center', flexDirection: 'row' }, error: { color: '#BA1A1A' } });
