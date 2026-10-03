import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { tokens } from '@/theme';

/** Card grouping related rows under a gold label, as in the MeepVP screens. */
export function Section({ label, children }: { label: string; children: ReactNode }) {
  return <View style={styles.card}>
    <Text style={styles.label}>{label}</Text>
    {children}
  </View>;
}

/** Secondary text inside a section: empty states, sources and hints. */
export function Hint({ children, tone = 'muted' }: { children: ReactNode; tone?: 'muted' | 'error' }) {
  return <Text style={[styles.hint, tone === 'error' && styles.error]}>{children}</Text>;
}

const styles = StyleSheet.create({
  card: { backgroundColor: tokens.color.surface, borderColor: tokens.color.border, borderRadius: tokens.radius.large, borderWidth: 1, gap: tokens.space.sm, padding: tokens.space.md },
  label: { color: tokens.color.gold, fontFamily: tokens.font.semibold, fontSize: 12, letterSpacing: 1.2 },
  hint: { color: tokens.color.secondaryText, fontFamily: tokens.font.body, fontSize: 13, lineHeight: 19 },
  error: { color: tokens.color.warning },
});
