import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { ScoreCalendar, ScoreDropdown, ScoreTextField as TextInput } from '@marianellagl/scoreui';
import { IconButton, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTableScoreStore } from '@/stores/useTableScoreStore';
import { colors } from '@/theme';
import { AppButton as Button } from '@/components/AppButton';

export default function ScheduleScreen() {
  const { rules, scheduledGames, table, error, loadRules, loadScheduledGames, createScheduledGame } = useTableScoreStore();
  const [gameName, setGameName] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [players, setPlayers] = useState('');
  const [ruleId, setRuleId] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const today = new Date();
  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  useEffect(() => {
    loadRules().catch(() => undefined);
    if (table) loadScheduledGames().catch(() => undefined);
  }, [loadRules, loadScheduledGames, table]);

  async function schedule() {
    setFormError(null);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) {
      setFormError('Enter a date as YYYY-MM-DD and a time as HH:MM.');
      return;
    }
    const when = new Date(`${date}T${time}:00`);
    const [year, month, day] = date.split('-').map(Number);
    const [hour, minute] = time.split(':').map(Number);
    if (!Number.isFinite(when.getTime()) || when.getFullYear() !== year || when.getMonth() + 1 !== month || when.getDate() !== day || when.getHours() !== hour || when.getMinutes() !== minute) {
      setFormError('Enter a valid date and time.');
      return;
    }
    if (when <= new Date()) {
      setFormError('Choose a future date and time.');
      return;
    }
    if (!gameName.trim()) {
      setFormError('Enter the game name.');
      return;
    }
    setSaving(true);
    try {
      await createScheduledGame(gameName, when.toISOString(), players.split(',').map((name) => name.trim()).filter(Boolean), ruleId || undefined);
      setGameName(''); setDate(''); setTime(''); setPlayers(''); setRuleId('');
    } catch (cause) {
      setFormError(cause instanceof Error ? cause.message : 'Could not schedule this game.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.topRow}><IconButton icon="arrow-left" iconColor={colors.forest} onPress={() => router.back()} /><Text style={styles.topLabel}>GAME NIGHT</Text><View style={styles.topSpacer} /></View>
        <Text style={styles.title}>Schedule a game</Text>
        <Text style={styles.subtitle}>Pick a date now. You can add a scoring sheet later.</Text>
        <Text style={styles.muted}>If a scoring sheet is still missing, this device can remind you 24 hours before the game after you allow notifications.</Text>

        <View style={styles.card}>
          <TextInput label="Game name" value={gameName} onChangeText={setGameName} mode="outlined" />
          <ScoreCalendar selectedDate={date || null} onSelect={setDate} minDate={todayKey} markedDates={scheduledGames.map((game) => { const day = new Date(game.scheduledAt); return `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`; })} />
          <TextInput label="Time · HH:MM" placeholder="20:00" value={time} onChangeText={setTime} keyboardType="numbers-and-punctuation" mode="outlined" />
          <TextInput label="Players (optional)" placeholder="Ana, Leo" value={players} onChangeText={setPlayers} mode="outlined" />
          <ScoreDropdown label="Scoring sheet (optional)" value={ruleId} options={[{ value: '', label: 'Add one later' }, ...rules.map((rule) => ({ value: rule.id, label: `${rule.gameName} · ${rule.name}` }))]} onChange={(selected) => { setRuleId(selected); const rule = rules.find((item) => item.id === selected); if (rule && !gameName.trim()) setGameName(rule.gameName); }} />
          {formError && <Text style={styles.error}>{formError}</Text>}
          <Button mode="contained" icon="calendar-plus" loading={saving} disabled={saving} onPress={schedule}>Schedule game</Button>
        </View>

        <Text style={styles.heading}>Your scheduled games</Text>
        {error && <Text style={styles.error}>{error}</Text>}
        {scheduledGames.length === 0 && <View style={styles.card}><Text style={styles.muted}>No games scheduled yet.</Text></View>}
        {scheduledGames.map((game) => (
          <View key={game.id} style={styles.card}>
            <Text style={styles.gameName}>{game.gameName}</Text>
            <Text style={styles.muted}>{new Date(game.scheduledAt).toLocaleString()}</Text>
            <Text style={styles.muted}>{game.players.length ? game.players.join(', ') : 'Players not added yet'}</Text>
            {game.sessionId ? (
              <Button mode="contained" icon="arrow-right" onPress={() => router.push(`/sessions/${game.sessionId}`)}>Open game</Button>
            ) : game.ruleId ? (
              <>
                <Text style={styles.ready}>Scoring sheet ready</Text>
                <Button mode="contained" icon="play" onPress={() => router.push({ pathname: '/sessions/new', params: { ruleId: game.ruleId, players: game.players.join(','), planId: game.id } })}>Start scoring</Button>
              </>
            ) : (
              <>
                <Text style={styles.missing}>No scoring sheet yet</Text>
                <Button mode="outlined" icon="account-group-outline" onPress={() => router.push({ pathname: '/community/rules', params: { game: game.gameName, planId: game.id } })}>Find a community sheet</Button>
                <Button mode="outlined" icon="plus" onPress={() => router.push({ pathname: '/rules/new', params: { game: game.gameName, planId: game.id } })}>Create scoring sheet</Button>
              </>
            )}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.canvas },
  content: { gap: 14, padding: 20, paddingBottom: 45 },
  topRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginLeft: -12 },
  topLabel: { color: colors.orangeInk, fontSize: 10, fontWeight: '800', letterSpacing: 1.4 },
  topSpacer: { width: 40 },
  title: { color: colors.ink, fontSize: 31, fontWeight: '800' },
  subtitle: { color: colors.muted, fontSize: 14, lineHeight: 21 },
  card: { backgroundColor: colors.paper, borderColor: colors.line, borderRadius: 20, borderWidth: 1, gap: 12, padding: 17 },
  dateRow: { flexDirection: 'row', gap: 8 },
  dateField: { flex: 1.4 },
  timeField: { flex: 1 },
  muted: { color: colors.muted, fontSize: 13, lineHeight: 19 },
  heading: { color: colors.ink, fontSize: 21, fontWeight: '800', marginTop: 10 },
  gameName: { color: colors.ink, fontSize: 18, fontWeight: '800' },
  ready: { color: colors.forest, fontSize: 13, fontWeight: '700' },
  missing: { color: colors.orangeInk, fontSize: 13, fontWeight: '700' },
  error: { color: colors.error, fontSize: 13 },
});
