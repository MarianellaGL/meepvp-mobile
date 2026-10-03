import { useEffect, useRef } from 'react';
import { ActivityIndicator, Image, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ScoreButton } from '@decodadev02/meepleui';

import { HostActions } from '@/features/sessions/components/HostActions';
import { useLiveDuration } from '@/features/sessions/components/LiveDuration';
import { ScoreSheet } from '@/features/sessions/components/ScoreSheet';
import { Standings } from '@/features/sessions/components/Standings';
import { WaitingRoom } from '@/features/sessions/WaitingRoom';
import { useBoardPhotoPicker } from '@/hooks/useBoardPhotoPicker';
import { useSessionLiveSync } from '@/hooks/useSessionLiveSync';
import { api, type ScoreSession } from '@/lib/api';
import { Hint, Section } from '@/shared/ui/Section';
import { Screen } from '@/shared/ui/Screen';
import { useAuthStore } from '@/stores/useAuthStore';
import { useTableScoreStore } from '@/stores/useTableScoreStore';
import { tokens } from '@/theme';

export default function GameScreen() {
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const attemptedHostJoin = useRef(new Set<string>());
  const {
    session, table, rules, selfPlayerId, myPlayerName, username, loadRules, loadSession, refreshSession, updateScore, adjustPoints, finishSession, pauseSession, resumeSession, startSession, saveBoardPhoto, reopenSession, joinSessionAsMe, error,
    isRestoring, isLoadingSession, isUpdatingScore, isAdjustingPoints, isFinishingSession, isPausingSession, isResumingSession, isStartingSession, isUploadingBoardPhoto, isReopeningSession, isJoiningSession,
  } = useTableScoreStore();
  const accountPlayerId = useAuthStore((state) => state.sessions.find((game) => game.id === sessionId)?.myPlayerId);
  const accountUser = useAuthStore((state) => state.user);
  const { photoError, pickBoardPhoto } = useBoardPhotoPicker(saveBoardPhoto);
  const selfName = (myPlayerName || username || 'Vos').trim();
  const isHost = !!session && !!table && table.code.toLocaleUpperCase() === session.tableCode.toLocaleUpperCase();
  const hostInSession = !!session?.players.some((player) => player.id === selfPlayerId);

  useEffect(() => { loadRules().catch(() => undefined); }, [loadRules]);
  useEffect(() => {
    if (sessionId && session?.id !== sessionId) loadSession(sessionId, accountPlayerId).catch(() => undefined);
  }, [sessionId, session?.id, accountPlayerId, loadSession]);
  useSessionLiveSync(sessionId, session, refreshSession);
  // The host joins their own game with their player name the first time they open it.
  useEffect(() => {
    if (!session || !isHost || accountUser || session.status !== 'active' || hostInSession || !selfName) return;
    const key = `${session.id}:${selfName.toLocaleLowerCase()}`;
    if (attemptedHostJoin.current.has(key)) return;
    attemptedHostJoin.current.add(key);
    joinSessionAsMe(selfName).catch(() => undefined);
  }, [session, isHost, accountUser, hostInSession, selfName, joinSessionAsMe]);

  if (!session || session.id !== sessionId) {
    return <View style={styles.centered}>
      {isRestoring || isLoadingSession || !error ? <>
        <ActivityIndicator size="large" color={tokens.color.gold} />
        <Text style={styles.centeredText}>Cargando partida…</Text>
      </> : <>
        <Text style={styles.centeredTitle}>No pudimos cargar esta partida</Text>
        <Hint tone="error">{error}</Hint>
        <ScoreButton label="Reintentar" icon="refresh" onPress={() => loadSession(sessionId).catch(() => undefined)} />
      </>}
    </View>;
  }

  // Guests may not have the host's private sheet saved; the game brings it.
  const rule = rules.find((candidate) => candidate.id === session.ruleId) ?? session.rule;
  if (!rule) {
    return <View style={styles.centered}>
      {error ? <><Hint tone="error">{error}</Hint><ScoreButton label="Reintentar" icon="refresh" onPress={() => loadRules().catch(() => undefined)} /></> : <ActivityIndicator size="large" color={tokens.color.gold} />}
    </View>;
  }

  if (session.status === 'waiting') {
    return <WaitingRoom session={session} gameName={rule.gameName} isHost={isHost} selfPlayerId={selfPlayerId} starting={isStartingSession} error={error} onStart={() => startSession().catch(() => undefined)} />;
  }

  const isFinished = session.status === 'finished';
  const isPaused = session.status === 'paused';
  const busy = isUpdatingScore || isAdjustingPoints || isFinishingSession || isPausingSession || isResumingSession || isUploadingBoardPhoto;
  const selfPlayer = session.players.find((player) => player.id === selfPlayerId);
  const myTotal = selfPlayer ? session.totals.find((item) => item.playerId === selfPlayer.id)?.total ?? 0 : 0;
  const winners = isFinished ? (session.winners ?? []).map((result) => ({ ...result, name: session.players.find((player) => player.id === result.playerId)?.name ?? 'Jugador' })) : [];

  const footer = isHost && isPaused
    ? <ScoreButton label="Reanudar partida" icon="play" loading={isResumingSession} disabled={busy} onPress={() => resumeSession().catch(() => undefined)} />
    : isHost && isFinished
      ? <ScoreButton label="Reabrir para corregir puntos" icon="restart" variant="secondary" loading={isReopeningSession} onPress={() => reopenSession().catch(() => undefined)} />
      : undefined;

  return <Screen eyebrow="PARTIDA" title={rule.gameName} subtitle={rule.name} onBack={() => router.back()} footer={footer}>
    <StatusLine key={`${session.id}:${session.lastModified}:${session.status}`} session={session} />
    {error && <Hint tone="error">{error}</Hint>}

    {isFinished && winners.length > 0 && <Section label="RESULTADO">
      <Text style={styles.winner}>{winners.length === 1 ? `Ganó ${winners[0].name}` : `Empate entre ${winners.map((winner) => winner.name).join(' y ')}`}</Text>
      <Hint>{winners[0].total} puntos · {rule.winCondition === 'lowest_total' ? 'gana quien suma menos' : 'gana quien suma más'}</Hint>
    </Section>}

    <Section label={isFinished ? 'POSICIONES FINALES' : 'POSICIONES'}>
      <Standings session={session} rule={rule} selfPlayerId={selfPlayerId} />
    </Section>

    {isPaused && <Section label="PARTIDA PAUSADA">
      <Hint>El reloj está detenido y los puntos de todos quedan guardados. Pueden seguir otro día.</Hint>
      {isHost && <>
        <ScoreButton label="Sacar foto del tablero" icon="camera" variant="secondary" loading={isUploadingBoardPhoto} disabled={isUploadingBoardPhoto} onPress={() => pickBoardPhoto('camera')} />
        <ScoreButton label="Elegir foto de la galería" icon="image" variant="tertiary" disabled={isUploadingBoardPhoto} onPress={() => pickBoardPhoto('library')} />
        {photoError && <Hint tone="error">{photoError}</Hint>}
      </>}
    </Section>}

    {session.boardPhotoUpdatedAt && <Section label="FOTO DEL TABLERO">
      <Image source={{ uri: api.boardPhotoURL(session.id, session.boardPhotoUpdatedAt) }} style={styles.photo} resizeMode="contain" accessibilityLabel="Cómo quedó el tablero" />
      <Hint>{new Date(session.boardPhotoUpdatedAt).toLocaleString('es-AR')}</Hint>
    </Section>}

    {/* A finished game shows the result; scores come back when it is reopened. */}
    {isFinished ? null : selfPlayer ? <Section label={`TUS PUNTOS · ${myTotal}`}>
      <ScoreSheet
        fields={rule.fields}
        values={session.values[selfPlayer.id] ?? {}}
        manualPoints={session.manualPoints?.[selfPlayer.id] ?? 0}
        disabled={session.status !== 'active' || busy}
        onScore={(fieldId, value) => updateScore(selfPlayer.id, fieldId, value)}
        onAdjust={(delta) => adjustPoints(selfPlayer.id, delta)}
      />
      {isPaused && <Hint>Se anota cuando el anfitrión reanude la partida.</Hint>}
    </Section> : <Section label="TUS PUNTOS">
      {isHost
        ? <>
            <Hint>{isJoiningSession ? `Sumándote a la mesa como ${selfName}…` : `Vas a anotar como ${selfName}.`}</Hint>
            {error && <ScoreButton label="Reintentar" icon="refresh" variant="secondary" onPress={() => joinSessionAsMe(selfName).catch(() => undefined)} />}
          </>
        : <>
            <Hint>Unite con tu nombre para anotar tus puntos.</Hint>
            <ScoreButton label="Unirme a la partida" icon="account-plus-outline" variant="secondary" onPress={() => router.push({ pathname: '/join', params: { code: session.tableCode } })} />
          </>}
    </Section>}

    {isHost && session.status === 'active' && <HostActions
      tableCode={session.tableCode}
      busy={busy}
      pausing={isPausingSession}
      finishing={isFinishingSession}
      onPause={() => pauseSession().catch(() => undefined)}
      onFinish={() => finishSession().catch(() => undefined)}
    />}
  </Screen>;
}

/** Status and played time in one line. */
function StatusLine({ session }: { session: ScoreSession }) {
  const duration = useLiveDuration(session);
  const finished = session.status === 'finished';
  const paused = session.status === 'paused';
  const label = finished
    ? `Terminada · ${duration} jugados`
    : paused ? `Pausada · ${duration} jugados` : `En curso · ${duration}`;
  return <View style={styles.status} accessibilityLiveRegion="none">
    <View style={[styles.dot, (finished || paused) && styles.dotStopped]} />
    <Text style={styles.statusText}>{label}</Text>
  </View>;
}

const styles = StyleSheet.create({
  centered: { alignItems: 'center', backgroundColor: tokens.color.canvas, flex: 1, gap: tokens.space.md, justifyContent: 'center', padding: tokens.space.lg },
  centeredText: { color: tokens.color.secondaryText, fontFamily: tokens.font.body },
  centeredTitle: { color: tokens.color.primaryText, fontFamily: tokens.font.heading, fontSize: 22, textAlign: 'center' },
  status: { alignItems: 'center', alignSelf: 'flex-start', backgroundColor: tokens.color.surface, borderColor: tokens.color.border, borderRadius: 999, borderWidth: 1, flexDirection: 'row', gap: 8, paddingHorizontal: 12, paddingVertical: 6 },
  dot: { backgroundColor: tokens.color.success, borderRadius: 4, height: 8, width: 8 },
  dotStopped: { backgroundColor: tokens.color.brand },
  statusText: { color: tokens.color.primaryText, fontFamily: tokens.font.semibold, fontSize: 13, fontVariant: ['tabular-nums'] },
  winner: { color: tokens.color.primaryText, fontFamily: tokens.font.heading, fontSize: 26, lineHeight: 32 },
  photo: { backgroundColor: tokens.color.canvas, borderRadius: tokens.radius.medium, height: 220, width: '100%' },
});
