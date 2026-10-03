import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ScoreButton } from '@decodadev02/meepleui';

import { TableQRCode } from '@/components/TableQRCode';
import { tokens } from '@/theme';

type HostActionsProps = {
  tableCode: string;
  busy: boolean;
  pausing: boolean;
  finishing: boolean;
  onPause: () => void;
  onFinish: () => void;
};

/** What only the host does during a game: invite, pause and finish. */
export function HostActions({ tableCode, busy, pausing, finishing, onPause, onFinish }: HostActionsProps) {
  const [panel, setPanel] = useState<'invite' | 'finish' | null>(null);
  const toggle = (next: 'invite' | 'finish') => setPanel((current) => current === next ? null : next);
  return <View style={styles.wrap}>
    <View style={styles.row}>
      <Action icon="account-plus-outline" label="Invitar" active={panel === 'invite'} onPress={() => toggle('invite')} />
      <Action icon="pause" label={pausing ? 'Pausando…' : 'Pausar'} disabled={busy} onPress={onPause} />
      <Action icon="flag-checkered" label="Terminar" active={panel === 'finish'} disabled={busy} onPress={() => toggle('finish')} />
    </View>
    {panel === 'invite' && <TableQRCode code={tableCode} />}
    {panel === 'finish' && <View style={styles.confirm}>
      <Text style={styles.confirmText}>¿Terminar y ver quién ganó? Después podés reabrirla para corregir puntos.</Text>
      <ScoreButton label="Terminar partida" icon="flag-checkered" loading={finishing} disabled={busy} onPress={onFinish} />
      <ScoreButton label="Seguir jugando" variant="tertiary" onPress={() => setPanel(null)} />
    </View>}
  </View>;
}

function Action({ icon, label, active, disabled, onPress }: { icon: keyof typeof MaterialCommunityIcons.glyphMap; label: string; active?: boolean; disabled?: boolean; onPress: () => void }) {
  return <Pressable accessibilityRole="button" accessibilityState={{ disabled, expanded: active }} disabled={disabled} onPress={onPress} style={({ pressed }) => [styles.action, active && styles.active, (pressed || disabled) && styles.dim]}>
    <MaterialCommunityIcons name={icon} size={22} color={tokens.color.gold} />
    <Text style={styles.label}>{label}</Text>
  </Pressable>;
}

const styles = StyleSheet.create({
  wrap: { gap: tokens.space.sm },
  row: { flexDirection: 'row', gap: tokens.space.sm },
  action: { alignItems: 'center', backgroundColor: tokens.color.surface, borderColor: tokens.color.border, borderRadius: tokens.radius.medium, borderWidth: 1, flex: 1, gap: 4, minHeight: 64, justifyContent: 'center', paddingVertical: 8 },
  active: { borderColor: tokens.color.gold },
  dim: { opacity: 0.6 },
  label: { color: tokens.color.primaryText, fontFamily: tokens.font.semibold, fontSize: 13 },
  confirm: { backgroundColor: tokens.color.surface, borderColor: tokens.color.gold, borderRadius: tokens.radius.large, borderWidth: 1, gap: tokens.space.sm, padding: tokens.space.md },
  confirmText: { color: tokens.color.primaryText, fontFamily: tokens.font.body, fontSize: 14, lineHeight: 20 },
});
