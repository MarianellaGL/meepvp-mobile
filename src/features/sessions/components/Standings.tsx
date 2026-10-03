import { StyleSheet, Text, View } from 'react-native';

import type { ScoreSession, ScoringRule } from '@/lib/api';
import { tokens } from '@/theme';

type StandingsProps = { session: ScoreSession; rule: ScoringRule; selfPlayerId: string | null };

/** Compact ranking: one row per player, best first, leader highlighted. */
export function Standings({ session, rule, selfPlayerId }: StandingsProps) {
  const lowestWins = rule.winCondition === 'lowest_total';
  const rows = session.players
    .map((player) => ({ ...player, total: session.totals.find((item) => item.playerId === player.id)?.total ?? 0 }))
    .sort((a, b) => lowestWins ? a.total - b.total : b.total - a.total);
  const someoneScored = rows.some((row) => row.total !== 0);
  return <View accessibilityRole="list" style={styles.list}>
    {rows.map((row, index) => {
      const leader = someoneScored && index === 0;
      const self = row.id === selfPlayerId;
      return <View key={row.id} accessibilityRole="text" accessibilityLabel={`${index + 1}. ${row.name}${self ? ', vos' : ''}: ${row.total} puntos`} style={[styles.row, leader && styles.leader]}>
        <Text style={[styles.position, leader && styles.leaderText]}>{index + 1}</Text>
        <Text style={[styles.name, self && styles.self]} numberOfLines={1}>{row.name}{self && row.name.toLocaleLowerCase() !== 'vos' ? ' · vos' : ''}</Text>
        <Text style={[styles.total, leader && styles.leaderText]}>{row.total}</Text>
      </View>;
    })}
  </View>;
}

const styles = StyleSheet.create({
  list: { gap: 6 },
  row: { alignItems: 'center', backgroundColor: tokens.color.elevated, borderColor: tokens.color.elevated, borderRadius: tokens.radius.medium, borderWidth: 1, flexDirection: 'row', gap: tokens.space.sm, minHeight: 46, paddingHorizontal: tokens.space.md },
  leader: { borderColor: tokens.color.gold },
  position: { color: tokens.color.secondaryText, fontFamily: tokens.font.semibold, fontSize: 13, width: 18 },
  name: { color: tokens.color.primaryText, flex: 1, fontFamily: tokens.font.semibold, fontSize: 15 },
  self: { color: tokens.color.gold },
  total: { color: tokens.color.primaryText, fontFamily: tokens.font.semibold, fontSize: 20, fontVariant: ['tabular-nums'] },
  leaderText: { color: tokens.color.gold },
});
