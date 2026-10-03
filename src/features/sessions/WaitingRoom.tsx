import { StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { MeepleAvatar, ScoreBadge, ScoreButton } from '@decodadev02/meepleui';

import { TableQRCode } from '@/components/TableQRCode';
import type { ScoreSession } from '@/lib/api';
import { Hint, Section } from '@/shared/ui/Section';
import { Screen } from '@/shared/ui/Screen';
import { tokens } from '@/theme';

type WaitingRoomProps = {
  session: ScoreSession;
  gameName: string;
  isHost: boolean;
  selfPlayerId: string | null;
  starting: boolean;
  error: string | null;
  onStart: () => void;
};

/** Before the game starts: who is at the table, who is missing and how to join. */
export function WaitingRoom({ session, gameName, isHost, selfPlayerId, starting, error, onStart }: WaitingRoomProps) {
  const missing = session.players.filter((player) => !player.joined);
  return <Screen
    eyebrow="ESPERANDO JUGADORES"
    title={gameName}
    subtitle={missing.length ? `La partida empieza sola cuando se ${missing.length === 1 ? 'una' : 'unan'} ${missing.map((player) => player.name).join(' y ')}.` : 'Ya están todos. Empezando…'}
    onBack={() => router.back()}
    footer={isHost ? <>
      {error && <Hint tone="error">{error}</Hint>}
      <ScoreButton label="Empezar sin esperar" variant="secondary" icon="play" loading={starting} disabled={starting} onPress={onStart} />
    </> : undefined}
  >
    <Section label={`EN LA MESA · ${session.players.length - missing.length} DE ${session.players.length}`}>
      {session.players.map((player) => <View key={player.id} style={styles.player}>
        <MeepleAvatar name={player.name} size={36} />
        <Text style={styles.name} numberOfLines={1}>{player.name}{player.id === selfPlayerId && player.name.toLocaleLowerCase() !== 'vos' ? ' · vos' : ''}</Text>
        {player.joined
          ? <ScoreBadge label="En la mesa" tone="success" />
          : <View style={styles.waiting}><MaterialCommunityIcons name="timer-sand" size={16} color={tokens.color.secondaryText} /><Text style={styles.waitingText}>Esperando…</Text></View>}
      </View>)}
    </Section>
    {isHost
      ? <Section label="PARA UNIRSE">
          <Hint>Que escaneen el QR o ingresen el código desde «Unirse a una partida», con su nombre.</Hint>
          <TableQRCode code={session.tableCode} />
        </Section>
      : <Hint>Cuando estén todos, la partida empieza y vas a poder anotar tus puntos.</Hint>}
  </Screen>;
}

const styles = StyleSheet.create({
  player: { alignItems: 'center', flexDirection: 'row', gap: tokens.space.sm, minHeight: 44 },
  name: { color: tokens.color.primaryText, flex: 1, fontFamily: tokens.font.semibold, fontSize: 15 },
  waiting: { alignItems: 'center', flexDirection: 'row', gap: 4 },
  waitingText: { color: tokens.color.secondaryText, fontFamily: tokens.font.body, fontSize: 13 },
});
