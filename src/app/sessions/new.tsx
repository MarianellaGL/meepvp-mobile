import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { MeepleAvatar, MeepleLibraryEntry, ScoreButton, ScoreDropdown, ScoreTextField } from '@decodadev02/meepleui';

import { addPlayer, gamePlayers, playerSuggestions } from '@/features/sessions/players';
import { Hint, Section } from '@/shared/ui/Section';
import { Screen } from '@/shared/ui/Screen';
import { useTableScoreStore } from '@/stores/useTableScoreStore';
import { tokens } from '@/theme';

export default function NewGameScreen() {
  const { ruleId, players: plannedPlayers, planId } = useLocalSearchParams<{ ruleId?: string; players?: string; planId?: string }>();
  const { rules, knownPlayers, myPlayerName, username, error, loadRules, createSession, createTable, setMyPlayerName, setScheduledGameSession, table, isCreatingTable } = useTableScoreStore();
  const [selectedRuleId, setSelectedRuleId] = useState(ruleId ?? '');
  const [choosingRule, setChoosingRule] = useState(false);
  const [selfNameDraft, setSelfNameDraft] = useState<string | null>(null);
  // Without a saved name the field starts open; typing must not close it.
  const [editingSelf, setEditingSelf] = useState(() => !(myPlayerName || username));
  const [players, setPlayers] = useState<string[]>(() => (plannedPlayers ?? '').split(',').reduce<string[]>((list, name) => addPlayer(list, name, ''), []));
  const [newPlayer, setNewPlayer] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const selfName = (selfNameDraft ?? (myPlayerName || username || '')).trim();
  const rule = rules.find((candidate) => candidate.id === selectedRuleId);
  const everyone = gamePlayers(selfName, players);
  const suggestions = playerSuggestions(knownPlayers, players, selfName);
  const waitsForOthers = everyone.length > 1;

  useEffect(() => { loadRules().catch(() => undefined); }, [loadRules]);

  function add(name: string) {
    setPlayers((current) => addPlayer(current, name, selfName));
    setNewPlayer('');
  }

  async function startGame() {
    if (!selectedRuleId || !selfName) return;
    setIsSaving(true);
    try {
      await setMyPlayerName(selfName);
      if (!table) await createTable(rule ? `Mesa de ${rule.gameName}` : 'Noche de juegos');
      const session = await createSession(selectedRuleId, everyone);
      if (planId) await setScheduledGameSession(planId, session.id).catch(() => undefined);
      router.replace(`/sessions/${session.id}`);
    } catch { /* The store shows the error. */ }
    finally { setIsSaving(false); }
  }

  return <Screen
    eyebrow="NUEVA PARTIDA"
    title={rule?.gameName ?? 'Nueva partida'}
    subtitle="Elegí la planilla y quiénes juegan."
    onBack={() => router.back()}
    footer={<>
      {error && <Hint tone="error">{error}</Hint>}
      {!selfName && <Hint>Escribí tu nombre para empezar.</Hint>}
      <ScoreButton
        label={waitsForOthers ? 'Crear partida e invitar' : 'Empezar partida'}
        icon={waitsForOthers ? 'account-group' : 'play'}
        loading={isSaving || isCreatingTable}
        disabled={!selectedRuleId || !selfName || isSaving}
        onPress={() => void startGame()}
      />
    </>}
  >
    <Section label="PLANILLA">
      {rule && !choosingRule
        ? <MeepleLibraryEntry title={rule.gameName} detail={`${rule.fields.length} ${rule.fields.length === 1 ? 'categoría' : 'categorías'} · tocá para cambiar`} onPress={() => setChoosingRule(true)} />
        : rules.length
          ? <ScoreDropdown label="Elegí la planilla" value={selectedRuleId} options={rules.map((item) => ({ value: item.id, label: `${item.gameName} · ${item.name}` }))} onChange={(value) => { setSelectedRuleId(value); setChoosingRule(false); }} />
          : <Hint>Todavía no tenés planillas.</Hint>}
      <ScoreButton label="Buscar otro juego" icon="magnify" variant="tertiary" onPress={() => router.push({ pathname: '/games', params: { flow: 'setup' } })} />
    </Section>

    <Section label={`JUGADORES · ${everyone.length}`}>
      {editingSelf
        ? <ScoreTextField label="Tu nombre" placeholder="Cómo te ven los demás" value={selfName} onChangeText={setSelfNameDraft} returnKeyType="done" onSubmitEditing={() => { if (selfName) setEditingSelf(false); }} />
        : <PlayerRow name={selfName} detail="Vos · tocá para cambiar tu nombre" onPress={() => setEditingSelf(true)} />}
      {players.map((name) => <PlayerRow key={name} name={name} onRemove={() => setPlayers((current) => current.filter((player) => player !== name))} />)}
      <View style={styles.addRow}>
        <View style={styles.addField}><ScoreTextField label="Agregar jugador" placeholder="Nombre" value={newPlayer} onChangeText={setNewPlayer} returnKeyType="done" onSubmitEditing={() => add(newPlayer)} /></View>
        <Pressable accessibilityRole="button" accessibilityLabel="Agregar jugador" disabled={!newPlayer.trim()} onPress={() => add(newPlayer)} style={[styles.addButton, !newPlayer.trim() && styles.dim]}>
          <MaterialCommunityIcons name="plus" size={26} color={tokens.color.canvas} />
        </Pressable>
      </View>
      {suggestions.length > 0 && <View style={styles.chips}>
        {suggestions.map((name) => <Pressable key={name} accessibilityRole="button" accessibilityLabel={`Agregar a ${name}`} onPress={() => add(name)} style={styles.chip}>
          <MaterialCommunityIcons name="plus" size={14} color={tokens.color.gold} />
          <Text style={styles.chipText}>{name}</Text>
        </Pressable>)}
      </View>}
      <Hint>{waitsForOthers ? 'Los demás se unen con el código desde su teléfono. La partida empieza cuando están todos.' : 'Si jugás con más personas, agregalas: se unen con un código.'}</Hint>
    </Section>
  </Screen>;
}

function PlayerRow({ name, detail, onPress, onRemove }: { name: string; detail?: string; onPress?: () => void; onRemove?: () => void }) {
  return <Pressable disabled={!onPress} onPress={onPress} accessibilityRole={onPress ? 'button' : undefined} style={styles.player}>
    <MeepleAvatar name={name} size={36} />
    <View style={styles.playerCopy}>
      <Text style={styles.playerName} numberOfLines={1}>{name}</Text>
      {detail && <Text style={styles.playerDetail}>{detail}</Text>}
    </View>
    {onRemove && <Pressable accessibilityRole="button" accessibilityLabel={`Quitar a ${name}`} hitSlop={10} onPress={onRemove}>
      <MaterialCommunityIcons name="close" size={20} color={tokens.color.secondaryText} />
    </Pressable>}
  </Pressable>;
}

const styles = StyleSheet.create({
  player: { alignItems: 'center', flexDirection: 'row', gap: tokens.space.sm, minHeight: 48 },
  playerCopy: { flex: 1, gap: 1 },
  playerName: { color: tokens.color.primaryText, fontFamily: tokens.font.semibold, fontSize: 15 },
  playerDetail: { color: tokens.color.secondaryText, fontFamily: tokens.font.body, fontSize: 12 },
  addRow: { alignItems: 'center', flexDirection: 'row', gap: tokens.space.sm },
  addField: { flex: 1 },
  addButton: { alignItems: 'center', backgroundColor: tokens.color.brand, borderRadius: tokens.radius.medium, height: 52, justifyContent: 'center', width: 52 },
  dim: { opacity: 0.4 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: tokens.space.sm },
  chip: { alignItems: 'center', borderColor: tokens.color.gold, borderRadius: 999, borderWidth: 1, flexDirection: 'row', gap: 4, paddingHorizontal: 12, paddingVertical: 6 },
  chipText: { color: tokens.color.gold, fontFamily: tokens.font.semibold, fontSize: 13 },
});
