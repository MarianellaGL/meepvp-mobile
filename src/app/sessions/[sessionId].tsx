import { useEffect, useRef, useState } from 'react';
import { Image, ScrollView, StyleSheet, TextInput as NumberInput, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { MeepleDisclosure, ScoreCheckbox, ScoreTextField as TextInput } from '@decodadev02/meepleui';
import { ActivityIndicator, IconButton, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTableScoreStore } from '@/stores/useTableScoreStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { colors } from '@/theme';
import { AppButton as Button } from '@/components/AppButton';
import { TableQRCode } from '@/components/TableQRCode';
import { api, type ScoreSession } from '@/lib/api';
import { useSessionLiveSync } from '@/hooks/useSessionLiveSync';
import { useBoardPhotoPicker } from '@/hooks/useBoardPhotoPicker';

function SessionDuration({ session }: { session: ScoreSession }) {
  const [extraSeconds, setExtraSeconds] = useState(0);
  useEffect(() => {
    if (session.status !== 'active') return;
    const started = Date.now();
    const timer = setInterval(() => setExtraSeconds(Math.floor((Date.now() - started) / 1000)), 1000);
    return () => clearInterval(timer);
  }, [session.id, session.lastModified, session.status]);
  const total = Math.max(0, (session.durationSeconds ?? session.playedSeconds ?? 0) + extraSeconds);
  const days = Math.floor(total / 86400);
  const hours = Math.floor((total % 86400) / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  return <Text style={styles.durationValue}>{days ? `${days} d · ` : ''}{hours ? `${hours} h · ` : ''}{minutes} min · {String(seconds).padStart(2, '0')} s</Text>;
}

function QuickPoints({ playerId, manualPoints, disabled, onAdjust }: { playerId: string; manualPoints: number; disabled: boolean; onAdjust: (playerId: string, delta: number) => Promise<void> }) {
  const [amount, setAmount] = useState('1');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const points = Number(amount);
  const valid = Number.isSafeInteger(points) && points > 0 && points <= 10000;
  const change = async (sign: 1 | -1) => {
    if (!valid || disabled || saving) return;
    setSaving(true);
    setMessage('Guardando…');
    try { await onAdjust(playerId, sign * points); setMessage(`${sign > 0 ? '+' : ''}${sign * points} puntos · cambio guardado`); }
    catch { setMessage('No pudimos guardar. Reintentá.'); }
    finally { setSaving(false); }
  };

  return (
    <View style={styles.quickPoints}>
      <View style={styles.quickHeading}><Text style={styles.quickTitle}>Sumar puntos directamente</Text><Text style={styles.quickTotal}>{manualPoints} puntos manuales</Text></View>
      <View style={styles.quickControls}>
        <TextInput label="Puntos" value={amount} onChangeText={setAmount} keyboardType="number-pad" mode="outlined" style={styles.pointsInput} />
        <Button mode="contained" icon="plus" disabled={disabled || saving || !valid} onPress={() => change(1)}>Sumar</Button>
        <Button mode="outlined" icon="minus" disabled={disabled || saving || !valid} onPress={() => change(-1)}>Restar</Button>
      </View>
      {!!message && <Text style={[styles.saveMessage, message.startsWith('No pudimos') && styles.error]}>{message}</Text>}
    </View>
  );
}

function ScoreValueInput({ name, value, kind, pointsPerUnit, disabled, onSave }: { name: string; value: number; kind: 'manual' | 'counter'; pointsPerUnit: number; disabled: boolean; onSave: (value: number) => Promise<void> }) {
  const [editingDraft, setEditingDraft] = useState<string | null>(null);
  const [error, setError] = useState('');
  const draft = editingDraft ?? String(value);

  function commit() {
    const next = Number(draft);
    setEditingDraft(null);
    if (!draft.trim() || !Number.isSafeInteger(next) || next < (kind === 'manual' ? -99999 : 0) || next > 99999) {
      setError('Ingresá un número válido.');
      return;
    }
    setError('');
    if (next !== value) onSave(next).catch(() => undefined);
  }

  return <View style={styles.scoreInputRow}>
    <View style={styles.fieldDetails}><Text style={styles.fieldName}>{name}</Text><Text style={styles.fieldPoints}>{kind === 'manual' ? 'Puntos' : `${pointsPerUnit} puntos por unidad`}</Text></View>
    <NumberInput value={draft} onChangeText={(text) => { if (/^-?\d{0,5}$/.test(text)) setEditingDraft(text); }} onFocus={() => setEditingDraft(String(value))} onBlur={commit} editable={!disabled} keyboardType="numbers-and-punctuation" selectTextOnFocus style={styles.scoreNumberInput} accessibilityLabel={`${name}: ${kind === 'manual' ? 'puntos' : 'unidades'}`} />
    {!!error && <Text style={styles.inputError}>{error}</Text>}
  </View>;
}

export default function ScoringScreen() {
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const attemptedHostJoin = useRef(new Set<string>());
  const scrollRef = useRef<ScrollView>(null);
  const scoreEditorY = useRef(0);
  const [confirmFinish, setConfirmFinish] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [showPhotoOptions, setShowPhotoOptions] = useState(false);
  const {
    session, table, rules, selfPlayerId, myPlayerName, username, loadRules, loadSession, refreshSession, updateScore, adjustPoints, finishSession, pauseSession, resumeSession, saveBoardPhoto, reopenSession, joinSessionAsMe, error,
    isRestoring, isLoadingSession, isUpdatingScore, isAdjustingPoints, isFinishingSession, isPausingSession, isResumingSession, isUploadingBoardPhoto, isReopeningSession, isJoiningSession,
  } = useTableScoreStore();
  const accountPlayerId = useAuthStore((state) => state.sessions.find((game) => game.id === sessionId)?.myPlayerId);
  const { photoError, pickBoardPhoto } = useBoardPhotoPicker(saveBoardPhoto);
  const accountUser = useAuthStore((state) => state.user);
  const selfName = (myPlayerName || username || 'Vos').trim();
  const isHost = !!session && !!table && table.code.toLocaleUpperCase() === session.tableCode.toLocaleUpperCase();
  const hostInSession = !!session?.players.some((player) => player.id === selfPlayerId);

  useEffect(() => { loadRules().catch(() => undefined); }, [loadRules]);
  useEffect(() => {
    if (sessionId && session?.id !== sessionId) loadSession(sessionId, accountPlayerId).catch(() => undefined);
  }, [sessionId, session?.id, accountPlayerId, loadSession]);
  useSessionLiveSync(sessionId, session, refreshSession);
  useEffect(() => {
    if (!session || !isHost || accountUser || session.status !== 'active' || hostInSession || !selfName) return;
    const key = `${session.id}:${selfName.toLocaleLowerCase()}`;
    if (attemptedHostJoin.current.has(key)) return;
    attemptedHostJoin.current.add(key);
    joinSessionAsMe(selfName).catch(() => undefined);
  }, [session, isHost, accountUser, hostInSession, selfName, joinSessionAsMe]);

  if (!session || session.id !== sessionId) {
    return (
      <SafeAreaView style={styles.centered}>
        {isRestoring || isLoadingSession || !error ? (
          <><ActivityIndicator size="large" /><Text>Cargando partida…</Text></>
        ) : (
          <>
            <Text variant="titleLarge" style={styles.centerTitle}>No pudimos cargar esta partida</Text>
            <Text style={styles.error}>{error}</Text>
            <Button mode="contained" onPress={() => loadSession(sessionId).catch(() => undefined)}>Reintentar</Button>
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
          <><Text style={styles.error}>{error}</Text><Button mode="contained" onPress={() => loadRules().catch(() => undefined)}>Reintentar</Button></>
        ) : <ActivityIndicator size="large" />}
      </SafeAreaView>
    );
  }

  const isFinished = session.status === 'finished';
  const isPaused = session.status === 'paused';
  const controlsDisabled = session.status !== 'active' || isUpdatingScore || isAdjustingPoints || isFinishingSession || isPausingSession;
  const selfPlayer = session.players.find((player) => player.id === selfPlayerId);
  const myTotal = selfPlayer ? session.totals.find((item) => item.playerId === selfPlayer.id)?.total ?? 0 : null;
  const winners = isFinished ? (session.winners ?? []).map((result) => ({ ...result, name: session.players.find((player) => player.id === result.playerId)?.name ?? 'Jugador' })) : [];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView ref={scrollRef} contentContainerStyle={styles.content}>
        <View style={styles.topRow}>
          <IconButton icon="arrow-left" iconColor={colors.forest} onPress={() => router.back()} style={styles.backButton} />
          <Text style={styles.topLabel}>TABLA DE PUNTOS</Text>
          <View style={styles.topSpacer} />
        </View>
        <Text style={styles.title}>{rule.gameName}</Text>
        <Text style={styles.subtitle}>{rule.name}</Text>
        {isFinished && <Text style={styles.finishedAt}>Finalizada el {new Date(session.finishedAt ?? session.lastModified).toLocaleString('es-AR')}</Text>}
        <View style={styles.status}>
          <View style={[styles.statusDot, { backgroundColor: isFinished || isPaused ? colors.orange : colors.forest }]} />
          <Text style={styles.statusText}>{isFinished ? 'PARTIDA TERMINADA' : isPaused ? 'PARTIDA PAUSADA' : 'PARTIDA EN CURSO'}</Text>
        </View>
        {isHost && !isFinished && <View style={styles.inviteSection}>
          <Button mode="outlined" icon="account-plus-outline" onPress={() => setShowInvite((visible) => !visible)}>{showInvite ? 'Ocultar invitación' : 'Invitar jugadores'}</Button>
          {showInvite && <TableQRCode code={table.code} />}
        </View>}
        <View style={styles.durationCard}>
          <Text style={styles.durationLabel}>TIEMPO JUGADO</Text>
          <SessionDuration key={`${session.id}:${session.lastModified}:${session.status}`} session={session} />
          {isPaused && <Text style={styles.durationHint}>El tiempo está detenido. Podés seguir otro día.</Text>}
        </View>
        {isFinished && winners.length > 0 && (
          <View style={styles.winnerCard}>
            <MaterialCommunityIcons name="trophy" size={31} color={colors.orangeInk} />
            <Text style={styles.winnerTitle}>{winners.length === 1 ? `Ganó ${winners[0].name}` : `Empate: ${winners.map((winner) => winner.name).join(', ')}`}</Text>
            <Text style={styles.winnerPoints}>{winners[0].total} puntos · {rule.winCondition === 'lowest_total' ? 'gana el menor puntaje' : 'gana el mayor puntaje'}</Text>
          </View>
        )}
        {error && <Text style={styles.topError}>{error}</Text>}
        {isFinished && isHost && <Button mode="contained" icon="restart" loading={isReopeningSession} onPress={() => reopenSession().catch(() => undefined)} style={styles.reopenButton}>Reabrir partida para editar puntos</Button>}

        {!isFinished && isHost && <View style={styles.pauseCard}>
          {isPaused ? <>
            <Text style={styles.pauseTitle}>Guardá cómo quedó el tablero</Text>
            {myTotal !== null && <Text style={styles.durationHint}>Tus {myTotal} puntos siguen guardados. El reloj está detenido.</Text>}
            <Text style={styles.durationHint}>Quienes tengan la partida podrán ver la foto desde su celular.</Text>
            <Button mode="contained" icon="play" loading={isResumingSession} disabled={isUploadingBoardPhoto || isResumingSession} onPress={() => resumeSession().catch(() => undefined)}>Reanudar partida</Button>
            <MeepleDisclosure title="Guardar foto del tablero" expanded={showPhotoOptions} onPress={() => setShowPhotoOptions((shown) => !shown)} />
            {showPhotoOptions && <View style={styles.photoActions}>
              <Button mode="outlined" icon="camera" loading={isUploadingBoardPhoto} disabled={isUploadingBoardPhoto} onPress={() => pickBoardPhoto('camera')}>Tomar foto</Button>
              <Button mode="text" icon="image" disabled={isUploadingBoardPhoto} onPress={() => pickBoardPhoto('library')}>Elegir de la galería</Button>
            </View>}
          </> : <>
            <Text style={styles.durationHint}>Al pausar se conserva el puntaje de todos y se detiene el tiempo jugado.</Text>
            <Button mode="contained" icon="pause" loading={isPausingSession} disabled={controlsDisabled} onPress={() => pauseSession().catch(() => undefined)}>Pausar partida</Button>
          </>}
          {photoError && <Text style={styles.topError}>{photoError}</Text>}
        </View>}

        {session.boardPhotoUpdatedAt && <View style={styles.photoCard}>
          <Text style={styles.pauseTitle}>Foto del tablero</Text>
          <Image source={{ uri: api.boardPhotoURL(session.id, session.boardPhotoUpdatedAt) }} style={styles.boardPhoto} resizeMode="contain" accessibilityLabel="Estado del tablero guardado para esta partida" />
          <Text style={styles.durationHint}>Última foto: {new Date(session.boardPhotoUpdatedAt).toLocaleString('es-AR')}</Text>
        </View>}

        {isHost && !selfPlayer && !isFinished && (
          <View style={styles.joinCard}>
            <Text style={styles.joinTitle}>Sumándote a la mesa</Text>
            <Text style={styles.joinCopy}>Tus puntos aparecerán como {selfName}.</Text>
            {isJoiningSession ? <ActivityIndicator /> : error ? <Button mode="outlined" onPress={() => joinSessionAsMe(selfName).catch(() => undefined)}>Reintentar</Button> : <ActivityIndicator />}
          </View>
        )}

        {selfPlayer && (
          <View style={styles.myScoreCard}>
            <Text style={styles.myScoreLabel}>TUS PUNTOS · {selfPlayer.name}</Text>
            <Text style={styles.myScoreTotal}>{myTotal} puntos</Text>
            <QuickPoints playerId={selfPlayer.id} manualPoints={session.manualPoints?.[selfPlayer.id] ?? 0} disabled={controlsDisabled} onAdjust={adjustPoints} />
          </View>
        )}

        <View style={styles.scoreboard}>
          <View style={styles.scoreboardHeading}>
            <MaterialCommunityIcons name="trophy-outline" size={22} color={colors.forest} />
            <Text style={styles.scoreboardTitle}>Tabla de posiciones</Text>
          </View>
          <View style={styles.totalGrid}>
            {session.players.map((player) => (
              <View key={player.id} style={styles.totalTile}>
                <Text style={styles.totalName} numberOfLines={1}>{player.name}{selfPlayer?.id === player.id ? ' · VOS' : ''}</Text>
                <Text style={styles.totalValue}>{session.totals.find((item) => item.playerId === player.id)?.total ?? 0}</Text>
                <Text style={styles.totalLabel}>PUNTOS</Text>
              </View>
            ))}
          </View>
          {!isFinished && !isPaused && selfPlayer && <Button mode="outlined" icon="pencil-outline" onPress={() => scrollRef.current?.scrollTo({ y: scoreEditorY.current, animated: true })}>Ir a mis puntos</Button>}
        </View>

        {!isFinished && isHost && (confirmFinish ? (
          <View style={styles.finishConfirm}>
            <Text style={styles.finishConfirmText}>¿Terminar la partida y mostrar quién ganó? Podrás reabrirla para seguir contando.</Text>
            <View style={styles.finishActions}>
              <Button mode="text" onPress={() => setConfirmFinish(false)}>Cancelar</Button>
              <Button mode="contained" loading={isFinishingSession} disabled={isUpdatingScore || isAdjustingPoints || isFinishingSession || isPausingSession || isResumingSession || isUploadingBoardPhoto} onPress={() => finishSession().then(() => setConfirmFinish(false)).catch(() => undefined)}>Terminar partida</Button>
            </View>
          </View>
        ) : <Button mode="text" icon="flag-checkered" disabled={isUpdatingScore || isAdjustingPoints || isPausingSession || isResumingSession || isUploadingBoardPhoto} onPress={() => setConfirmFinish(true)} style={styles.finishButton}>Terminar partida</Button>)}

        <View style={styles.sectionHeading}>
          <Text style={styles.eyebrow}>EL DETALLE</Text>
          <Text variant="headlineSmall" style={styles.heading}>Tu tablero de puntuación</Text>
        </View>

        {selfPlayer ? (
          <View style={styles.playerCard} onLayout={(event) => { scoreEditorY.current = event.nativeEvent.layout.y; }}>
            <View style={styles.playerHeader}>
              <View style={styles.playerAvatar}><Text style={styles.avatarText}>{selfPlayer.name.charAt(0).toUpperCase()}</Text></View>
              <Text style={styles.playerName}>{selfPlayer.name} · Vos</Text>
              <Text style={styles.playerTotal}>{session.totals.find((item) => item.playerId === selfPlayer.id)?.total ?? 0} pts</Text>
            </View>
            {rule.fields.map((field) => {
              const value = session.values[selfPlayer.id]?.[field.id] ?? 0;
              return field.kind === 'checkbox' ? (
                <ScoreCheckbox key={field.id} label={`${field.name} · ${field.pointsPerUnit > 0 ? '+' : ''}${field.pointsPerUnit} pts`} checked={value > 0} disabled={controlsDisabled} onChange={(checked) => updateScore(selfPlayer.id, field.id, checked ? 1 : 0).catch(() => undefined)} />
              ) : (
                <ScoreValueInput key={field.id} name={field.name} kind={field.kind} pointsPerUnit={field.pointsPerUnit} value={value} disabled={controlsDisabled} onSave={(next) => updateScore(selfPlayer.id, field.id, next)} />
              );
            })}
            <Button mode="contained" icon="arrow-up" onPress={() => scrollRef.current?.scrollTo({ y: 0, animated: true })}>Volver a partida</Button>
          </View>
        ) : <View style={styles.joinCard}><Text style={styles.durationHint}>Unite a la partida con tu nombre para cargar tus puntos.</Text>{!isHost && <Button mode="outlined" onPress={() => router.push('/join')}>Unirme a la partida</Button>}</View>}

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
  finishedAt: { color: colors.muted, fontSize: 13, marginTop: 6 },
  status: { alignItems: 'center', alignSelf: 'flex-start', backgroundColor: colors.mint, borderRadius: 18, flexDirection: 'row', gap: 7, marginTop: 17, paddingHorizontal: 11, paddingVertical: 7 },
  statusDot: { borderRadius: 4, height: 7, width: 7 },
  statusText: { color: colors.forest, fontSize: 10, fontWeight: '800', letterSpacing: 0.7 },
  inviteSection: { gap: 10, marginTop: 12 },
  durationCard: { backgroundColor: colors.paper, borderColor: colors.line, borderRadius: 18, borderWidth: 1, gap: 3, marginTop: 14, padding: 16 },
  durationLabel: { color: colors.orangeInk, fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  durationValue: { color: colors.ink, fontSize: 27, fontWeight: '800' },
  durationHint: { color: colors.muted, fontSize: 13, lineHeight: 19 },
  pauseCard: { backgroundColor: colors.mint, borderRadius: 18, gap: 9, marginTop: 15, padding: 15 },
  photoActions: { gap: 9 },
  pauseTitle: { color: colors.ink, fontSize: 16, fontWeight: '800' },
  photoCard: { backgroundColor: colors.paper, borderColor: colors.line, borderRadius: 18, borderWidth: 1, gap: 9, marginTop: 15, padding: 15 },
  boardPhoto: { backgroundColor: colors.canvas, borderRadius: 13, height: 230, width: '100%' },
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
  winnerCard: { alignItems: 'center', backgroundColor: colors.orangePale, borderRadius: 22, gap: 8, marginTop: 17, padding: 22 },
  winnerTitle: { color: colors.ink, fontSize: 22, fontWeight: '800', textAlign: 'center' },
  winnerPoints: { color: colors.orangeInk, fontSize: 13, fontWeight: '700', textAlign: 'center' },
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
  scoreInputRow: { alignItems: 'center', borderTopColor: colors.line, borderTopWidth: 1, flexDirection: 'row', flexWrap: 'wrap', minHeight: 64, paddingVertical: 9 },
  scoreNumberInput: { borderColor: colors.line, borderRadius: 10, borderWidth: 1, color: colors.ink, fontSize: 17, fontWeight: '700', minWidth: 85, padding: 9, textAlign: 'center' },
  inputError: { color: colors.error, fontSize: 11, width: '100%' },
  counter: { alignItems: 'center', flexDirection: 'row' },
  counterValue: { color: colors.ink, fontSize: 17, fontWeight: '800', minWidth: 29, textAlign: 'center' },
  finishButton: { marginTop: 7 },
  error: { color: colors.error, textAlign: 'center' },
});
