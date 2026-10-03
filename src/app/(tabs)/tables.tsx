import { useCallback, useState } from 'react';
import { router, useFocusEffect } from 'expo-router';
import { MeepleLibraryEntry, ScoreButton, ScoreSkeleton } from '@decodadev02/meepleui';

import { describeGame, listGames, type GameEntry } from '@/features/sessions/games';
import { Hint, Section } from '@/shared/ui/Section';
import { Screen } from '@/shared/ui/Screen';
import { useAuthStore } from '@/stores/useAuthStore';
import { useTableScoreStore } from '@/stores/useTableScoreStore';

const finishedLimit = 5;

/** The Partidas tab: games going on now, then the finished ones. */
export default function GamesTab() {
  const { tables, tableSessions, session, guestSession, rules, hasRestored, isRestoring, refreshTables, selectTable, loadSession } = useTableScoreStore();
  const { user, sessions: accountSessions, refresh } = useAuthStore();
  const [opening, setOpening] = useState<string | null>(null);
  const [openError, setOpenError] = useState<string | null>(null);

  useFocusEffect(useCallback(() => {
    if (!hasRestored) return;
    refreshTables().catch(() => undefined);
    if (user) refresh().catch(() => undefined);
  }, [hasRestored, user, refreshTables, refresh]));

  const { ongoing, finished } = listGames({ tables, tableSessions, current: session, guest: guestSession, account: user ? accountSessions : [], rules });

  async function open(game: GameEntry) {
    setOpening(game.id);
    setOpenError(null);
    try {
      if (game.isHost) await selectTable(game.tableCode);
      else await loadSession(game.id, game.playerId);
      router.push(`/sessions/${game.id}`);
    } catch (cause) {
      setOpenError(cause instanceof Error ? cause.message : 'No pudimos abrir la partida.');
    } finally {
      setOpening(null);
    }
  }

  const row = (game: GameEntry) => <MeepleLibraryEntry key={game.id} title={game.gameName} detail={opening === game.id ? 'Abriendo…' : describeGame(game)} disabled={!!opening} onPress={() => void open(game)} />;

  return <Screen title="Partidas" subtitle="Las que están en juego y las que ya terminaron.">
    {openError && <Hint tone="error">{openError}</Hint>}
    {!hasRestored || isRestoring ? <ScoreSkeleton variant="list" /> : <>
      <Section label="AHORA">
        {ongoing.length ? ongoing.map(row) : <>
          <Hint>No tenés partidas en juego.</Hint>
          <ScoreButton label="Nueva partida" icon="plus" onPress={() => router.push('/sessions/new')} />
          <ScoreButton label="Unirme a una partida" icon="qrcode-scan" variant="secondary" onPress={() => router.push('/join')} />
        </>}
      </Section>

      <Section label="TERMINADAS">
        {finished.length ? finished.slice(0, finishedLimit).map(row) : user && <Hint>Cuando termines una partida, aparece acá con quién ganó.</Hint>}
        {user && finished.length > finishedLimit && <ScoreButton label="Ver todo el historial" icon="history" variant="tertiary" onPress={() => router.push('/history')} />}
        {!user && <Hint>Sin cuenta, las partidas terminadas no quedan guardadas. Con una cuenta ves todo tu historial y tus estadísticas.</Hint>}
        {!user && <ScoreButton label="Crear cuenta" icon="account-plus-outline" variant="tertiary" onPress={() => router.push({ pathname: '/auth', params: { mode: 'signup' } })} />}
      </Section>
    </>}
  </Screen>;
}
