import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { ScoreCalendar, ScoreDropdown, ScoreTextField as TextInput } from '@decodadev02/meepleui';
import { IconButton, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTableScoreStore } from '@/stores/useTableScoreStore';
import { colors } from '@/theme';
import { AppButton as Button } from '@/components/AppButton';

export default function ScheduleScreen() {
  const { rules, scheduledGames, table, error, loadRules, loadScheduledGames, createScheduledGame, updateScheduledGame, deleteScheduledGame } = useTableScoreStore();
  const [gameName, setGameName] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [players, setPlayers] = useState('');
  const [ruleId, setRuleId] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const today = new Date();
  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  useEffect(() => {
    loadRules().catch(() => undefined);
    if (table) loadScheduledGames().catch(() => undefined);
  }, [loadRules, loadScheduledGames, table]);

  async function schedule() {
    setFormError(null);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) {
      setFormError('Ingresá una fecha AAAA-MM-DD y una hora HH:MM.');
      return;
    }
    const when = new Date(`${date}T${time}:00`);
    const [year, month, day] = date.split('-').map(Number);
    const [hour, minute] = time.split(':').map(Number);
    if (!Number.isFinite(when.getTime()) || when.getFullYear() !== year || when.getMonth() + 1 !== month || when.getDate() !== day || when.getHours() !== hour || when.getMinutes() !== minute) {
      setFormError('Ingresá una fecha y hora válidas.');
      return;
    }
    if (when <= new Date()) {
      setFormError('Elegí una fecha y hora futuras.');
      return;
    }
    if (!gameName.trim()) {
      setFormError('Ingresá el nombre del juego.');
      return;
    }
    setSaving(true);
    try {
      const playerNames = players.split(',').map((name) => name.trim()).filter(Boolean);
      if (editingId) await updateScheduledGame(editingId, gameName, when.toISOString(), playerNames);
      else await createScheduledGame(gameName, when.toISOString(), playerNames, ruleId || undefined);
      setGameName(''); setDate(''); setTime(''); setPlayers(''); setRuleId('');
      setEditingId(null);
    } catch (cause) {
      setFormError(cause instanceof Error ? cause.message : 'No pudimos programar la partida.');
    } finally {
      setSaving(false);
    }
  }

  function startEditing(id: string) {
    const game = scheduledGames.find((item) => item.id === id);
    if (!game) return;
    const when = new Date(game.scheduledAt);
    setEditingId(id); setConfirmDeleteId(null); setFormError(null);
    setGameName(game.gameName);
    setDate(`${when.getFullYear()}-${String(when.getMonth() + 1).padStart(2, '0')}-${String(when.getDate()).padStart(2, '0')}`);
    setTime(`${String(when.getHours()).padStart(2, '0')}:${String(when.getMinutes()).padStart(2, '0')}`);
    setPlayers(game.players.join(', '));
    setRuleId(game.ruleId ?? '');
  }

  async function cancelGame(id: string) {
    setSaving(true); setFormError(null);
    try { await deleteScheduledGame(id); setConfirmDeleteId(null); if (editingId === id) setEditingId(null); }
    catch (cause) { setFormError(cause instanceof Error ? cause.message : 'No pudimos cancelar la partida.'); }
    finally { setSaving(false); }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.topRow}><IconButton icon="arrow-left" iconColor={colors.forest} onPress={() => router.back()} /><Text style={styles.topLabel}>NOCHE DE JUEGOS</Text><View style={styles.topSpacer} /></View>
        <Text style={styles.title}>{editingId ? 'Editar partida programada' : 'Programar una partida'}</Text>
        <Text style={styles.subtitle}>{editingId ? 'Actualizá la fecha y los jugadores de esta partida.' : 'Elegí una fecha. Podés agregar la planilla después.'}</Text>
        <Text style={styles.muted}>Si falta la planilla, el dispositivo puede recordártelo 24 horas antes si permitís las notificaciones.</Text>

        <View style={styles.card}>
          <TextInput label="Nombre del juego" value={gameName} onChangeText={setGameName} mode="outlined" />
          <ScoreCalendar selectedDate={date || null} onSelect={setDate} minDate={todayKey} markedDates={scheduledGames.map((game) => { const day = new Date(game.scheduledAt); return `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`; })} />
          <TextInput label="Hora · HH:MM" placeholder="20:00" value={time} onChangeText={setTime} keyboardType="numbers-and-punctuation" mode="outlined" />
          <TextInput label="Jugadores (opcional)" placeholder="Ana, Leo" value={players} onChangeText={setPlayers} mode="outlined" />
          {!editingId && <ScoreDropdown label="Planilla (opcional)" value={ruleId} options={[{ value: '', label: 'Agregar después' }, ...rules.map((rule) => ({ value: rule.id, label: `${rule.gameName} · ${rule.name}` }))]} onChange={(selected) => { setRuleId(selected); const rule = rules.find((item) => item.id === selected); if (rule && !gameName.trim()) setGameName(rule.gameName); }} />}
          {formError && <Text style={styles.error}>{formError}</Text>}
          <Button mode="contained" icon={editingId ? 'content-save-outline' : 'calendar-plus'} loading={saving} disabled={saving} onPress={schedule}>{editingId ? 'Guardar cambios' : 'Programar partida'}</Button>
          {editingId && <Button mode="text" onPress={() => { setEditingId(null); setGameName(''); setDate(''); setTime(''); setPlayers(''); setRuleId(''); setFormError(null); }}>Dejar de editar</Button>}
        </View>

        <Text style={styles.heading}>Tus partidas programadas</Text>
        {error && <Text style={styles.error}>{error}</Text>}
        {scheduledGames.length === 0 && <View style={styles.card}><Text style={styles.muted}>Todavía no hay partidas programadas.</Text></View>}
        {scheduledGames.map((game) => (
          <View key={game.id} style={styles.card}>
            <Text style={styles.gameName}>{game.gameName}</Text>
            <Text style={styles.muted}>{new Date(game.scheduledAt).toLocaleString()}</Text>
            <Text style={styles.muted}>{game.players.length ? game.players.join(', ') : 'Todavía no agregaste jugadores'}</Text>
            {!game.sessionId && <View style={styles.actions}>
              <Button mode="outlined" icon="pencil-outline" disabled={saving} onPress={() => startEditing(game.id)}>Editar</Button>
              <Button mode="text" icon="close" disabled={saving} onPress={() => setConfirmDeleteId(game.id)}>Cancelar partida</Button>
            </View>}
            {confirmDeleteId === game.id && <View style={styles.confirmCard}>
              <Text style={styles.muted}>¿Cancelar esta partida programada? Se quitará el recordatorio.</Text>
              <Button mode="contained" loading={saving} disabled={saving} onPress={() => cancelGame(game.id)}>Sí, cancelar</Button>
              <Button mode="text" onPress={() => setConfirmDeleteId(null)}>Volver</Button>
            </View>}
            {game.sessionId ? (
              <Button mode="contained" icon="arrow-right" onPress={() => router.push(`/sessions/${game.sessionId}`)}>Abrir partida</Button>
            ) : game.ruleId ? (
              <>
                <Text style={styles.ready}>Planilla lista</Text>
                <Button mode="contained" icon="play" onPress={() => router.push({ pathname: '/sessions/new', params: { ruleId: game.ruleId, players: game.players.join(','), planId: game.id } })}>Empezar partida</Button>
              </>
            ) : (
              <>
                <Text style={styles.missing}>Todavía no hay planilla</Text>
                <Button mode="outlined" icon="account-group-outline" onPress={() => router.push({ pathname: '/community/rules', params: { game: game.gameName, planId: game.id } })}>Buscar en la comunidad</Button>
                <Button mode="outlined" icon="plus" onPress={() => router.push({ pathname: '/rules/new', params: { game: game.gameName, planId: game.id } })}>Crear planilla</Button>
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
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  confirmCard: { backgroundColor: colors.orangePale, borderRadius: 14, gap: 8, padding: 12 },
});
