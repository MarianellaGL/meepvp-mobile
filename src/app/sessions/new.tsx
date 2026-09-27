import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ScoreDropdown, ScoreTextField as TextInput } from '@decodadev02/scoreui';
import { Chip, IconButton, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTableScoreStore } from '@/stores/useTableScoreStore';
import { colors } from '@/theme';
import { AppButton as Button } from '@/components/AppButton';

export default function NewSessionScreen() {
  const { ruleId, players: plannedPlayers, planId } = useLocalSearchParams<{ ruleId?: string; players?: string; planId?: string }>();
  const [selectedRuleId, setSelectedRuleId] = useState(ruleId ?? '');
  const [playerNames, setPlayerNames] = useState(plannedPlayers ?? '');
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);
  const [selfNameDraft, setSelfNameDraft] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const { rules, knownPlayers, myPlayerName, username, error, loadRules, createSession, createTable, setMyPlayerName, setScheduledGameSession, table, isCreatingTable } = useTableScoreStore();
  const selfName = (selfNameDraft ?? (myPlayerName || username || 'Vos')).trim();

  const enteredPlayers = playerNames.split(',').map((name) => name.trim()).filter(Boolean);
  const players = selfName ? [selfName] : [];
  for (const name of selectedPlayers) {
    if (!players.some((existing) => existing.toLocaleLowerCase() === name.toLocaleLowerCase())) players.push(name);
  }
  for (const name of enteredPlayers) {
    if (!players.some((existing) => existing.toLocaleLowerCase() === name.toLocaleLowerCase())) players.push(name);
  }

  useEffect(() => { loadRules().catch(() => undefined); }, [loadRules]);

  async function startGame() {
    if (!selectedRuleId || !selfName) return;
    setIsSaving(true);
    try {
      await setMyPlayerName(selfName);
      if (!table) {
        const selectedRule = rules.find((rule) => rule.id === selectedRuleId);
        await createTable(selectedRule ? `Mesa de ${selectedRule.gameName}` : 'Noche de juegos');
      }
      const session = await createSession(selectedRuleId, players);
      if (planId) {
        try { await setScheduledGameSession(planId, session.id); }
        catch { /* The game is active even if the schedule link could not be saved. */ }
      }
      router.replace(`/sessions/${session.id}`);
    } catch { /* The store displays the error. */ }
    finally { setIsSaving(false); }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.topRow}><IconButton icon="arrow-left" iconColor={colors.forest} onPress={() => router.back()} /><Text style={styles.topLabel}>NUEVA PARTIDA</Text><View style={styles.topSpacer} /></View>
        <Text style={styles.title}>Prepará la mesa.</Text>
        <Text style={styles.subtitle}>Elegí cómo contar los puntos e invitá a todos.</Text>

        <View style={styles.sectionHeader}><Text style={styles.sectionLabel}>01 / PLANILLA DE PUNTOS</Text><Text style={styles.count}>{rules.length} disponibles</Text></View>
        <View style={styles.card}>
          {rules.length ? (
            <ScoreDropdown label="Planilla de puntos" value={selectedRuleId} onChange={setSelectedRuleId} options={rules.map((rule) => ({ value: rule.id, label: `${rule.gameName} · ${rule.name} (${rule.fields.length} campos)` }))} />
          ) : (
            <View style={styles.emptyRules}><Text style={styles.emptyTitle}>Todavía no hay planillas</Text><Text style={styles.emptyCopy}>Creá una y después volvé para empezar la partida.</Text><Button mode="outlined" icon="plus" onPress={() => router.push('/rules/new')}>Crear planilla</Button></View>
          )}
        </View>

        <Text style={styles.sectionLabel}>02 / JUGADORES</Text>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Vos también jugás</Text>
          <Text style={styles.cardCopy}>Tus puntos aparecerán en la mesa junto a los de los demás.</Text>
          <TextInput label="Tu nombre de jugador" value={selfName} onChangeText={setSelfNameDraft} mode="outlined" />
        </View>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>¿Quiénes juegan?</Text>
          <Text style={styles.cardCopy}>Elegí jugadores guardados o escribí sus nombres.</Text>
          {knownPlayers.filter((player) => player.toLocaleLowerCase() !== selfName.toLocaleLowerCase()).length > 0 && <View style={styles.playerChips}>{knownPlayers.filter((player) => player.toLocaleLowerCase() !== selfName.toLocaleLowerCase()).map((player) => (
            <Chip key={player} selected={selectedPlayers.includes(player)} onPress={() => setSelectedPlayers((current) => current.includes(player) ? current.filter((name) => name !== player) : [...current, player])}>{player}</Chip>
          ))}</View>}
          <TextInput label="Otros jugadores" placeholder="Ana, Leo, Sam" value={playerNames} onChangeText={setPlayerNames} mode="outlined" />
        </View>

        {error && <Text style={styles.error}>{error}</Text>}
        <Button mode="contained" icon="play" loading={isSaving || isCreatingTable} disabled={!selectedRuleId || !selfName || isSaving} onPress={startGame} style={styles.startButton}>Empezar partida</Button>
        {(!selectedRuleId || !selfName) && <Text style={styles.cardCopy}>Elegí una planilla e ingresá tu nombre para empezar.</Text>}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.canvas },
  content: { gap: 14, padding: 20, paddingBottom: 40 },
  topRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginLeft: -12 },
  topLabel: { color: colors.orangeInk, fontSize: 10, fontWeight: '800', letterSpacing: 1.4 },
  topSpacer: { width: 40 },
  title: { color: colors.ink, fontSize: 32, fontWeight: '800', letterSpacing: -1.1, marginTop: 6 },
  subtitle: { color: colors.muted, fontSize: 15, lineHeight: 21, marginBottom: 10 },
  sectionHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  sectionLabel: { color: colors.orangeInk, fontSize: 10, fontWeight: '800', letterSpacing: 1.4 },
  count: { color: colors.muted, fontSize: 12, fontWeight: '700' },
  card: { backgroundColor: colors.paper, borderColor: colors.line, borderRadius: 22, borderWidth: 1, padding: 17 },
  ruleRow: { alignItems: 'center', borderBottomColor: colors.line, borderBottomWidth: 1, flexDirection: 'row', minHeight: 68 },
  ruleText: { flex: 1 },
  ruleName: { color: colors.ink, fontSize: 15, fontWeight: '800' },
  ruleDescription: { color: colors.muted, fontSize: 12, marginTop: 4 },
  emptyRules: { alignItems: 'center', gap: 9, paddingVertical: 14 },
  emptyTitle: { color: colors.ink, fontSize: 16, fontWeight: '800' },
  emptyCopy: { color: colors.muted, lineHeight: 20, textAlign: 'center' },
  cardTitle: { color: colors.ink, fontSize: 16, fontWeight: '800' },
  cardCopy: { color: colors.muted, fontSize: 13, lineHeight: 19, marginBottom: 10, marginTop: 4 },
  playerChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  error: { color: colors.error },
  startButton: { marginTop: 5 },
});
