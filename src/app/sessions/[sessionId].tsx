import { useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { ScoreCheckbox, ScoreStepper, ScoreTextField as TextInput } from '@marianellagl/scoreui';
import { ActivityIndicator, IconButton, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTableScoreStore } from '@/stores/useTableScoreStore';
import { colors } from '@/theme';
import { AppButton as Button } from '@/components/AppButton';

function QuickPoints({ playerId, manualPoints, disabled, onAdjust }: { playerId: string; manualPoints: number; disabled: boolean; onAdjust: (playerId: string, delta: number) => Promise<void> }) {
  const [amount, setAmount] = useState('1');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const points = Number(amount);
  const valid = Number.isSafeInteger(points) && points > 0 && points <= 10000;
  const change = async (sign: 1 | -1) => {
    if (!valid || disabled || saving) return;
    setSaving(true);
    setMessage('Saving…');
    try { await onAdjust(playerId, sign * points); setMessage('Saved'); }
    catch { setMessage('Could not save. Try again.'); }
    finally { setSaving(false); }
  };

  return (
    <View style={styles.quickPoints}>
      <View style={styles.quickHeading}><Text style={styles.quickTitle}>Add points directly</Text><Text style={styles.quickTotal}>{manualPoints} manual pts</Text></View>
      <View style={styles.quickControls}>
        <TextInput label="Points" value={amount} onChangeText={setAmount} keyboardType="number-pad" mode="outlined" style={styles.pointsInput} />
        <Button mode="contained" icon="plus" disabled={disabled || saving || !valid} onPress={() => change(1)}>Add</Button>
        <Button mode="outlined" icon="minus" disabled={disabled || saving || !valid} onPress={() => change(-1)}>Remove</Button>
      </View>
      {!!message && <Text style={[styles.saveMessage, message.startsWith('Could not') && styles.error]}>{message}</Text>}
    </View>
  );
}

export default function ScoringScreen() {
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const attemptedHostJoin = useRef(new Set<string>());
  const [confirmFinish, setConfirmFinish] = useState(false);
  const {
    session, table, rules, selfPlayerId, myPlayerName, username, loadRules, loadSession, updateScore, adjustPoints, finishSession, reopenSession, joinSessionAsMe, error,
    isRestoring, isLoadingSession, isUpdatingScore, isAdjustingPoints, isFinishingSession, isReopeningSession, isJoiningSession,
  } = useTableScoreStore();
  const selfName = (myPlayerName || username || 'You').trim();
  const isHost = !!session && !!table && table.code.toLocaleUpperCase() === session.tableCode.toLocaleUpperCase();
  const hostInSession = !!session?.players.some((player) => player.id === selfPlayerId || player.name.toLocaleLowerCase() === selfName.toLocaleLowerCase());

  useEffect(() => { loadRules().catch(() => undefined); }, [loadRules]);
  useEffect(() => {
    if (sessionId && session?.id !== sessionId) loadSession(sessionId).catch(() => undefined);
  }, [sessionId, session?.id, loadSession]);
  useEffect(() => {
    if (!session || !isHost || session.status !== 'active' || hostInSession || !selfName) return;
    const key = `${session.id}:${selfName.toLocaleLowerCase()}`;
    if (attemptedHostJoin.current.has(key)) return;
    attemptedHostJoin.current.add(key);
    joinSessionAsMe(selfName).catch(() => undefined);
  }, [session, isHost, hostInSession, selfName, joinSessionAsMe]);

  if (!session || session.id !== sessionId) {
    return (
      <SafeAreaView style={styles.centered}>
        {isRestoring || isLoadingSession || !error ? (
          <><ActivityIndicator size="large" /><Text>Loading game…</Text></>
        ) : (
          <>
            <Text variant="titleLarge" style={styles.centerTitle}>Could not load this game</Text>
            <Text style={styles.error}>{error}</Text>
            <Button mode="contained" onPress={() => loadSession(sessionId).catch(() => undefined)}>Try again</Button>
          </>
        )}
      </SafeAreaView>
    );
  }

  const rule = rules.find((candidate) => candidate.id === session.ruleId);
  if (!rule) {
    return (
      <SafeAreaView style={styles.centered}>
        {error ? (
          <><Text style={styles.error}>{error}</Text><Button mode="contained" onPress={() => loadRules().catch(() => undefined)}>Try again</Button></>
        ) : <ActivityIndicator size="large" />}
      </SafeAreaView>
    );
  }

  const isFinished = session.status === 'finished';
  const controlsDisabled = isFinished || isUpdatingScore || isAdjustingPoints || isFinishingSession;
  const selfPlayer = session.players.find((player) => player.id === selfPlayerId) ?? session.players.find((player) => player.name.toLocaleLowerCase() === selfName.toLocaleLowerCase());

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.topRow}>
          <IconButton icon="arrow-left" iconColor={colors.forest} onPress={() => router.back()} style={styles.backButton} />
          <Text style={styles.topLabel}>SCORE TABLE</Text>
          <View style={styles.topSpacer} />
        </View>
        <Text style={styles.title}>{rule.gameName}</Text>
        <Text style={styles.subtitle}>{rule.name}</Text>
        <View style={styles.status}>
          <View style={[styles.statusDot, { backgroundColor: isFinished ? colors.orange : colors.forest }]} />
          <Text style={styles.statusText}>{isFinished ? 'FINISHED GAME' : 'GAME IN PROGRESS'}</Text>
        </View>
        {error && <Text style={styles.topError}>{error}</Text>}
        {isFinished && isHost && <Button mode="contained" icon="restart" loading={isReopeningSession} onPress={() => reopenSession().catch(() => undefined)} style={styles.reopenButton}>Reopen game to edit scores</Button>}

        {isHost && !selfPlayer && !isFinished && (
          <View style={styles.joinCard}>
            <Text style={styles.joinTitle}>Adding you to the table</Text>
            <Text style={styles.joinCopy}>Your score will appear as {selfName}.</Text>
            {isJoiningSession ? <ActivityIndicator /> : error ? <Button mode="outlined" onPress={() => joinSessionAsMe(selfName).catch(() => undefined)}>Try again</Button> : <ActivityIndicator />}
          </View>
        )}

        {selfPlayer && (
          <View style={styles.myScoreCard}>
            <Text style={styles.myScoreLabel}>YOUR SCORE · {selfPlayer.name}</Text>
            <Text style={styles.myScoreTotal}>{session.totals.find((item) => item.playerId === selfPlayer.id)?.total ?? 0} points</Text>
            <QuickPoints playerId={selfPlayer.id} manualPoints={session.manualPoints?.[selfPlayer.id] ?? 0} disabled={controlsDisabled} onAdjust={adjustPoints} />
          </View>
        )}

        <View style={styles.scoreboard}>
          <View style={styles.scoreboardHeading}>
            <MaterialCommunityIcons name="trophy-outline" size={22} color={colors.forest} />
            <Text style={styles.scoreboardTitle}>Scoreboard</Text>
          </View>
          <View style={styles.totalGrid}>
            {session.players.map((player) => (
              <View key={player.id} style={styles.totalTile}>
                <Text style={styles.totalName} numberOfLines={1}>{player.name}{selfPlayer?.id === player.id ? ' · YOU' : ''}</Text>
                <Text style={styles.totalValue}>{session.totals.find((item) => item.playerId === player.id)?.total ?? 0}</Text>
                <Text style={styles.totalLabel}>POINTS</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.sectionHeading}>
          <Text style={styles.eyebrow}>THE DETAILS</Text>
          <Text variant="headlineSmall" style={styles.heading}>Count the points</Text>
        </View>

        {session.players.map((player) => (
          <View key={player.id} style={styles.playerCard}>
            <View style={styles.playerHeader}>
              <View style={styles.playerAvatar}><Text style={styles.avatarText}>{player.name.charAt(0).toUpperCase()}</Text></View>
              <Text style={styles.playerName}>{player.name}{selfPlayer?.id === player.id ? ' · You' : ''}</Text>
              <Text style={styles.playerTotal}>{session.totals.find((item) => item.playerId === player.id)?.total ?? 0} pts</Text>
            </View>
            {selfPlayer?.id !== player.id && <QuickPoints playerId={player.id} manualPoints={session.manualPoints?.[player.id] ?? 0} disabled={controlsDisabled} onAdjust={adjustPoints} />}
            {rule.fields.map((field) => {
              const value = session.values[player.id]?.[field.id] ?? 0;
              return field.kind === 'checkbox' ? (
                <ScoreCheckbox key={field.id} label={`${field.name} · ${field.pointsPerUnit > 0 ? '+' : ''}${field.pointsPerUnit} pts`} checked={value > 0} disabled={controlsDisabled} onChange={(checked) => updateScore(player.id, field.id, checked ? 1 : 0).catch(() => undefined)} />
              ) : (
                <ScoreStepper key={field.id} player={field.name} detail={field.kind === 'manual' ? 'Manual points' : `${field.pointsPerUnit > 0 ? '+' : ''}${field.pointsPerUnit} per unit`} value={value} min={field.kind === 'manual' ? -999 : 0} max={999} disabled={controlsDisabled} onChange={(next) => updateScore(player.id, field.id, next).catch(() => undefined)} />
              );
            })}
          </View>
        ))}

        {!isFinished && (confirmFinish ? (
          <View style={styles.finishConfirm}>
            <Text style={styles.finishConfirmText}>Finish this game? Scoring will pause until you reopen it.</Text>
            <View style={styles.finishActions}>
              <Button mode="text" onPress={() => setConfirmFinish(false)}>Cancel</Button>
              <Button mode="contained" loading={isFinishingSession} disabled={controlsDisabled} onPress={() => finishSession().then(() => setConfirmFinish(false)).catch(() => undefined)}>Finish game</Button>
            </View>
          </View>
        ) : <Button mode="outlined" icon="flag-checkered" disabled={controlsDisabled} onPress={() => setConfirmFinish(true)} style={styles.finishButton}>Finish game</Button>)}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.canvas },
  centered: { alignItems: 'center', backgroundColor: colors.canvas, flex: 1, gap: 16, justifyContent: 'center', padding: 25 },
  centerTitle: { color: colors.ink, textAlign: 'center' },
  content: { padding: 20, paddingBottom: 38 },
  topRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginLeft: -10, marginTop: -4 },
  backButton: { margin: 0 },
  topLabel: { color: colors.orangeInk, fontSize: 10, fontWeight: '800', letterSpacing: 1.5 },
  topSpacer: { width: 38 },
  title: { color: colors.ink, fontSize: 34, fontWeight: '800', letterSpacing: -1.1, marginTop: 13 },
  subtitle: { color: colors.muted, fontSize: 15, marginTop: 4 },
  status: { alignItems: 'center', alignSelf: 'flex-start', backgroundColor: colors.mint, borderRadius: 18, flexDirection: 'row', gap: 7, marginTop: 17, paddingHorizontal: 11, paddingVertical: 7 },
  statusDot: { borderRadius: 4, height: 7, width: 7 },
  statusText: { color: colors.forest, fontSize: 10, fontWeight: '800', letterSpacing: 0.7 },
  joinCard: { backgroundColor: colors.mint, borderRadius: 19, gap: 11, marginTop: 20, padding: 16 },
  joinTitle: { color: colors.ink, fontSize: 16, fontWeight: '800' },
  joinCopy: { color: colors.muted, fontSize: 13, lineHeight: 19 },
  myScoreCard: { backgroundColor: colors.orangePale, borderRadius: 22, gap: 7, marginTop: 20, padding: 17 },
  myScoreLabel: { color: colors.orangeInk, fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  myScoreTotal: { color: colors.ink, fontSize: 30, fontWeight: '800' },
  quickPoints: { gap: 10, marginBottom: 12, marginTop: 5 },
  quickHeading: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  quickTitle: { color: colors.ink, fontSize: 13, fontWeight: '800' },
  quickTotal: { color: colors.muted, fontSize: 11 },
  quickControls: { alignItems: 'center', flexDirection: 'row', gap: 7 },
  pointsInput: { flex: 1, minWidth: 75 },
  saveMessage: { color: colors.forest, fontSize: 12, fontWeight: '700' },
  topError: { color: colors.error, marginTop: 12 },
  reopenButton: { alignSelf: 'flex-start', marginTop: 15 },
  finishConfirm: { backgroundColor: colors.orangePale, borderRadius: 18, gap: 11, marginTop: 14, padding: 15 },
  finishConfirmText: { color: colors.ink, fontSize: 13, lineHeight: 19 },
  finishActions: { flexDirection: 'row', justifyContent: 'flex-end' },
  scoreboard: { backgroundColor: colors.paper, borderColor: colors.forest, borderRadius: 24, borderWidth: 1, marginTop: 24, padding: 19 },
  scoreboardHeading: { alignItems: 'center', flexDirection: 'row', gap: 8 },
  scoreboardTitle: { color: colors.ink, fontSize: 17, fontWeight: '800' },
  totalGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 9, marginTop: 17 },
  totalTile: { backgroundColor: colors.mint, borderRadius: 16, flexBasis: 95, flexGrow: 1, minWidth: 95, padding: 12 },
  totalName: { color: colors.ink, fontSize: 12, fontWeight: '700' },
  totalValue: { color: colors.ink, fontSize: 30, fontWeight: '800', marginTop: 3 },
  totalLabel: { color: colors.muted, fontSize: 9, fontWeight: '800', letterSpacing: 1.1 },
  sectionHeading: { marginBottom: 14, marginTop: 27 },
  eyebrow: { color: colors.orangeInk, fontSize: 10, fontWeight: '800', letterSpacing: 1.5 },
  heading: { color: colors.ink, fontWeight: '800', marginTop: 4 },
  playerCard: { backgroundColor: colors.paper, borderColor: colors.line, borderRadius: 22, borderWidth: 1, marginBottom: 12, paddingHorizontal: 16, paddingTop: 14 },
  playerHeader: { alignItems: 'center', flexDirection: 'row', gap: 10, paddingBottom: 13 },
  playerAvatar: { alignItems: 'center', backgroundColor: colors.orangePale, borderRadius: 15, height: 38, justifyContent: 'center', width: 38 },
  avatarText: { color: colors.orangeInk, fontSize: 16, fontWeight: '800' },
  playerName: { color: colors.ink, flex: 1, fontSize: 16, fontWeight: '800' },
  playerTotal: { color: colors.forest, fontSize: 15, fontWeight: '800' },
  fieldRow: { alignItems: 'center', borderTopColor: colors.line, borderTopWidth: 1, flexDirection: 'row', justifyContent: 'space-between', minHeight: 62, paddingVertical: 8 },
  lastField: { paddingBottom: 12 },
  fieldDetails: { flex: 1, paddingRight: 6 },
  fieldName: { color: colors.ink, fontSize: 14, fontWeight: '700' },
  fieldPoints: { color: colors.muted, fontSize: 11, marginTop: 3 },
  counter: { alignItems: 'center', flexDirection: 'row' },
  counterValue: { color: colors.ink, fontSize: 17, fontWeight: '800', minWidth: 29, textAlign: 'center' },
  finishButton: { marginTop: 7 },
  error: { color: colors.error, textAlign: 'center' },
});
