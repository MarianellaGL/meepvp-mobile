import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ScoreBadge, ScoreGameCard, ScoreSkeleton, ScoreTextField as TextInput } from '@decodadev02/meepleui';
import { router, useFocusEffect } from 'expo-router';
import { Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTableScoreStore } from '@/stores/useTableScoreStore';
import { colors } from '@/theme';
import { AppButton as Button } from '@/components/AppButton';
import { TableQRCode } from '@/components/TableQRCode';
import { useAuthStore } from '@/stores/useAuthStore';

export default function TablesScreen() {
  const { table, tables, tableSessions, guestSession, isRestoring, hasRestored, error, restore, selectTable, refreshTables, loadSession, createTable, isCreatingTable } = useTableScoreStore();
  const { user, sessions: accountSessions, refresh } = useAuthStore();
  const [opening, setOpening] = useState<string | null>(null);
  const [openError, setOpenError] = useState<string | null>(null);
  const [newTableName, setNewTableName] = useState('');
  useFocusEffect(useCallback(() => {
    if (hasRestored) { refreshTables().catch(() => undefined); if (user) refresh().catch(() => undefined); }
  }, [hasRestored, user, refreshTables, refresh]));

  async function openTable(code: string, sessionId?: string) {
    setOpening(code); setOpenError(null);
    try {
      if (user && sessionId) await refresh();
      await selectTable(code);
      router.push(sessionId ? `/sessions/${sessionId}` : '/sessions/new');
    } catch (cause) { setOpenError(cause instanceof Error ? cause.message : 'No pudimos abrir la mesa.'); }
    finally { setOpening(null); }
  }

  async function openAccountSession(id: string, playerId?: string) {
    setOpening(id); setOpenError(null);
    try { await loadSession(id, playerId); router.push(`/sessions/${id}`); }
    catch (cause) { setOpenError(cause instanceof Error ? cause.message : 'No pudimos abrir la partida.'); }
    finally { setOpening(null); }
  }

  const joinedSessions = user ? accountSessions.filter((game) => game.status !== 'finished' && !tables.some((item) => item.code === game.tableCode)) : [];
  const localGuest = guestSession?.status !== 'finished' && !joinedSessions.some((game) => game.id === guestSession?.id) && !tables.some((item) => item.code === guestSession?.tableCode) ? guestSession : null;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.eyebrow}>JUGAR EN GRUPO</Text>
        <Text style={styles.title}>Tus mesas</Text>
        <Text style={styles.subtitle}>Un lugar para cada jugador y cada punto.</Text>
        <Button mode="outlined" icon="calendar-plus" onPress={() => router.push('/schedule')}>Programar una partida</Button>

        {!hasRestored || isRestoring ? (
          <ScoreSkeleton variant="card" />
        ) : tables.length ? tables.map((item) => {
          const currentSession = tableSessions[item.code];
          const activeSession = currentSession?.status === 'active' ? currentSession : null;
          const pausedSession = currentSession?.status === 'paused' ? currentSession : null;
          const accountPlayerId = accountSessions.find((game) => game.id === currentSession?.id)?.myPlayerId;
          const myTotal = currentSession?.totals.find((total) => total.playerId === accountPlayerId)?.total;
          return <View key={item.code} style={styles.tableCard}>
            <View style={styles.cardHeader}>
              <View style={styles.icon}><MaterialCommunityIcons name="table-furniture" size={29} color={colors.canvas} /></View>
              {activeSession && <ScoreBadge label="PARTIDA EN CURSO" tone="success" />}
              {pausedSession && <ScoreBadge label="PARTIDA PAUSADA" tone="warning" />}
            </View>
            <Text style={styles.tableName}>{item.name || 'Noche de juegos'}</Text>
            <Text style={styles.cardCopy}>{pausedSession ? 'La partida está guardada para seguirla otro día.' : activeSession ? 'Compartí el código para que se unan.' : 'No hay una partida en curso. Empezá una nueva para invitar jugadores.'}</Text>
            {activeSession && <View style={styles.codeBox}>
              <Text style={styles.codeLabel}>CÓDIGO DE MESA</Text>
              <Text style={styles.code}>{item.code}</Text>
            </View>}
            {activeSession && <TableQRCode code={item.code} />}
            {currentSession && (
              <View style={styles.sessionRow}>
                <MaterialCommunityIcons name="cards-playing-outline" size={20} color={colors.forest} />
                <View style={styles.sessionText}>
                  <Text style={styles.sessionTitle}>{pausedSession ? 'Partida pausada' : 'Partida en curso'}</Text>
                  <Text style={styles.sessionMeta}>{currentSession.players.length} jugadores · Puntos guardados</Text>
                </View>
              </View>
            )}
            {currentSession && myTotal !== undefined && <ScoreGameCard title={item.name || 'Noche de juegos'} detail={`${currentSession.players.length} jugadores`} score={myTotal} label="TUS PUNTOS" featured />}
            <Button mode="contained" icon="arrow-right" loading={opening === item.code} disabled={!!opening} onPress={() => openTable(item.code, currentSession?.id)}>
              {pausedSession ? 'Ver partida pausada' : activeSession ? 'Abrir partida' : 'Empezar una partida'}
            </Button>
          </View>
        }) : (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIcon}><MaterialCommunityIcons name="table-furniture" size={32} color={colors.forest} /></View>
            <Text variant="headlineSmall" style={styles.emptyTitle}>Tu próxima partida empieza acá</Text>
            <Text style={styles.emptyCopy}>Creá una mesa para llevar los puntos. No necesitás una cuenta.</Text>
            <Button mode="contained" icon="plus" onPress={() => router.navigate('/')}>Crear una mesa</Button>
          </View>
        )}

        {joinedSessions.length > 0 && <Text style={styles.joinedHeading}>Partidas donde jugás</Text>}
        {joinedSessions.map((game) => <View key={game.id} style={styles.tableCard}>
          <ScoreBadge label={game.status === 'paused' ? 'PARTIDA PAUSADA' : 'PARTIDA EN CURSO'} tone={game.status === 'paused' ? 'warning' : 'success'} />
          <Text style={styles.tableName}>{game.gameName}</Text>
          <Text style={styles.cardCopy}>{game.players.length} jugadores · Mesa {game.tableCode}</Text>
          <ScoreGameCard title={game.gameName} detail="Tu puntaje" score={game.totals.find((total) => total.playerId === game.myPlayerId)?.total ?? 0} label="TUS PUNTOS" featured />
          <Button mode="contained" icon="arrow-right" loading={opening === game.id} disabled={!!opening} onPress={() => openAccountSession(game.id, game.myPlayerId)}>Abrir partida</Button>
        </View>)}
        {localGuest && <View style={styles.tableCard}>
          <ScoreBadge label={localGuest.status === 'paused' ? 'PARTIDA PAUSADA' : 'PARTIDA EN CURSO'} tone={localGuest.status === 'paused' ? 'warning' : 'success'} />
          <Text style={styles.tableName}>Partida donde jugás</Text>
          <Text style={styles.cardCopy}>{localGuest.players.length} jugadores · Mesa {localGuest.tableCode}</Text>
          <Button mode="contained" icon="arrow-right" loading={opening === localGuest.id} disabled={!!opening} onPress={() => openAccountSession(localGuest.id)}>Abrir partida</Button>
        </View>}
        {(table || user) && <Button mode="outlined" icon="refresh" onPress={() => { refreshTables().catch(() => undefined); if (user) refresh().catch(() => undefined); }}>Actualizar partidas</Button>}
        {tables.length > 0 && <View style={styles.tableCard}>
          <Text style={styles.sessionTitle}>Otra noche de juegos</Text>
          <TextInput label="Nombre de la mesa" value={newTableName} onChangeText={setNewTableName} mode="outlined" />
          <Button mode="outlined" icon="plus" loading={isCreatingTable} disabled={isCreatingTable} onPress={() => createTable(newTableName).then(() => setNewTableName('')).catch(() => undefined)}>Crear otra mesa</Button>
        </View>}
        {openError && <Text style={styles.error}>{openError}</Text>}

        {error && (
          <View style={styles.errorCard}>
            <Text style={styles.error}>{error}</Text>
            <Button mode="text" onPress={() => restore().catch(() => undefined)}>Reintentar</Button>
          </View>
        )}

        <View style={styles.tip}>
          <MaterialCommunityIcons name="lightbulb-outline" size={20} color={colors.orangeInk} />
          <Text style={styles.tipText}>Consejo: creá una planilla de puntos antes de empezar una partida.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.canvas },
  content: { gap: 14, padding: 20, paddingBottom: 36 },
  joinedHeading: { color: colors.ink, fontSize: 20, fontWeight: '800', marginTop: 10 },
  eyebrow: { color: colors.orangeInk, fontSize: 10, fontWeight: '800', letterSpacing: 1.5, marginTop: 10 },
  title: { color: colors.ink, fontSize: 34, fontWeight: '800', letterSpacing: -1.2, marginTop: 4 },
  subtitle: { color: colors.muted, fontSize: 15, marginBottom: 28, marginTop: 5 },
  loader: { marginTop: 70 },
  tableCard: { backgroundColor: colors.paper, borderColor: colors.line, borderRadius: 26, borderWidth: 1, gap: 15, padding: 20 },
  cardHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  icon: { alignItems: 'center', backgroundColor: colors.forest, borderRadius: 17, height: 58, justifyContent: 'center', width: 58 },
  status: { alignItems: 'center', backgroundColor: colors.mint, borderRadius: 20, flexDirection: 'row', gap: 6, paddingHorizontal: 10, paddingVertical: 7 },
  statusDot: { backgroundColor: colors.forest, borderRadius: 4, height: 7, width: 7 },
  statusText: { color: colors.forest, fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  tableName: { color: colors.ink, fontSize: 27, fontWeight: '800', letterSpacing: -0.7, marginTop: 4 },
  cardCopy: { color: colors.muted, fontSize: 14, lineHeight: 20 },
  codeBox: { alignItems: 'center', backgroundColor: colors.canvas, borderRadius: 18, paddingVertical: 17 },
  codeLabel: { color: colors.muted, fontSize: 10, fontWeight: '800', letterSpacing: 1.6 },
  code: { color: colors.forest, fontSize: 35, fontWeight: '800', letterSpacing: 6, marginTop: 4 },
  sessionRow: { alignItems: 'center', backgroundColor: colors.mint, borderRadius: 15, flexDirection: 'row', gap: 10, padding: 12 },
  sessionText: { flex: 1 },
  sessionTitle: { color: colors.ink, fontSize: 14, fontWeight: '700' },
  sessionMeta: { color: colors.muted, fontSize: 12, marginTop: 2 },
  myScoreRow: { alignItems: 'center', backgroundColor: colors.canvas, borderRadius: 15, flexDirection: 'row', justifyContent: 'space-between', padding: 14 },
  myScoreLabel: { color: colors.muted, fontSize: 11, fontWeight: '800' },
  myScoreValue: { color: colors.forest, fontSize: 20, fontWeight: '800' },
  emptyCard: { alignItems: 'center', backgroundColor: colors.paper, borderColor: colors.line, borderRadius: 26, borderWidth: 1, gap: 13, padding: 28 },
  emptyIcon: { alignItems: 'center', backgroundColor: colors.mint, borderRadius: 22, height: 74, justifyContent: 'center', marginBottom: 5, width: 74 },
  emptyTitle: { color: colors.ink, fontWeight: '800', textAlign: 'center' },
  emptyCopy: { color: colors.muted, lineHeight: 20, textAlign: 'center' },
  errorCard: { backgroundColor: colors.orangePale, borderRadius: 16, marginTop: 16, padding: 12 },
  error: { color: colors.error },
  tip: { alignItems: 'flex-start', flexDirection: 'row', gap: 9, marginTop: 24, paddingHorizontal: 5 },
  tipText: { color: colors.muted, flex: 1, fontSize: 13, lineHeight: 19 },
});
