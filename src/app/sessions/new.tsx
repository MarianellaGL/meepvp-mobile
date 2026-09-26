import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { Button, IconButton, RadioButton, Text, TextInput } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTableScoreStore } from '@/stores/useTableScoreStore';

export default function NewSessionScreen() {
  const [selectedRuleId, setSelectedRuleId] = useState(''); const [playerNames, setPlayerNames] = useState(''); const [isSaving, setIsSaving] = useState(false);
  const { rules, error, loadRules, createSession } = useTableScoreStore();
  useEffect(() => { loadRules().catch(() => undefined); }, [loadRules]);
  async function startGame() {
    const players = playerNames.split(',').map((name) => name.trim()).filter(Boolean); if (!selectedRuleId || !players.length) return;
    setIsSaving(true); try { const session = await createSession(selectedRuleId, players); router.replace(`/sessions/${session.id}`); } catch { /* The global store retains the error. */ } finally { setIsSaving(false); }
  }
  return <SafeAreaView style={styles.safeArea} edges={['top']}><ScrollView contentContainerStyle={styles.content}>
    <View style={styles.header}><IconButton icon="arrow-left" onPress={() => router.back()} /><Text variant="headlineSmall">Start a game</Text></View>
    <Text variant="bodyMedium" style={styles.copy}>Choose a scoring sheet and add everyone at the table.</Text>
    <Text variant="titleMedium">Scoring sheet</Text>
    <RadioButton.Group value={selectedRuleId} onValueChange={setSelectedRuleId}>{rules.map((rule) => <RadioButton.Item key={rule.id} value={rule.id} label={`${rule.gameName} · ${rule.name}`} />)}</RadioButton.Group>
    {!rules.length && <Text variant="bodyMedium">No scoring sheets yet. Create one first.</Text>}
    <TextInput label="Players" placeholder="Ana, Leo, Sam" value={playerNames} onChangeText={setPlayerNames} mode="outlined" />
    <Text variant="bodySmall">Separate names with commas.</Text>
    {error && <Text style={styles.error}>{error}</Text>}
    <Button mode="contained" icon="play" loading={isSaving} disabled={!selectedRuleId || !playerNames.trim()} onPress={startGame}>Start scoring</Button>
  </ScrollView></SafeAreaView>;
}
const styles = StyleSheet.create({ safeArea: { flex: 1, backgroundColor: '#FFFBFE' }, content: { gap: 14, padding: 20 }, header: { alignItems: 'center', flexDirection: 'row', marginLeft: -12 }, copy: { color: '#625B71' }, error: { color: '#BA1A1A' } });
