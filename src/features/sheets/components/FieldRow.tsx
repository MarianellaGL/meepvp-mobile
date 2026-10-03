import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ScoreButton, ScoreDropdown, ScoreTextField } from '@decodadev02/meepleui';

import type { FieldKind } from '@/lib/api';
import { tokens } from '@/theme';
import { describeField, kindLabels, type DraftField } from '../draft';

const kindOptions = (Object.keys(kindLabels) as FieldKind[]).map((kind) => ({ value: kind, label: kindLabels[kind] }));

type FieldRowProps = {
  field: DraftField;
  expanded: boolean;
  onToggle: () => void;
  onChange: (changes: Partial<DraftField>) => void;
  onRemove?: () => void;
};

/** A scoring category: one summary line, expanded in place to edit it. */
export function FieldRow({ field, expanded, onToggle, onChange, onRemove }: FieldRowProps) {
  const title = field.name.trim() || 'Categoría sin nombre';
  return <View style={[styles.row, expanded && styles.expanded]}>
    <Pressable accessibilityRole="button" accessibilityState={{ expanded }} accessibilityLabel={`${title}. ${describeField(field)}`} onPress={onToggle} style={styles.summary}>
      <View style={styles.copy}>
        <Text style={[styles.title, !field.name.trim() && styles.missing]}>{title}</Text>
        <Text style={styles.detail}>{describeField(field)}</Text>
      </View>
      <MaterialCommunityIcons name={expanded ? 'chevron-up' : 'pencil-outline'} size={20} color={tokens.color.gold} />
    </Pressable>
    {expanded && <View style={styles.editor}>
      <ScoreTextField label="Nombre" placeholder="Cartas, monedas, objetivos…" value={field.name} onChangeText={(name) => onChange({ name })} />
      <ScoreDropdown label="Cómo se cuenta" value={field.kind} options={kindOptions} onChange={(kind) => onChange({ kind: kind as FieldKind })} />
      {field.kind !== 'manual' && <ScoreTextField label={field.kind === 'checkbox' ? 'Puntos si se cumple' : 'Puntos por cada uno'} keyboardType="numbers-and-punctuation" value={field.points} onChangeText={(points) => onChange({ points })} helperText="Usá un número negativo para penalizaciones." />}
      {onRemove && <ScoreButton label="Quitar categoría" variant="tertiary" icon="delete-outline" onPress={onRemove} />}
    </View>}
  </View>;
}

const styles = StyleSheet.create({
  row: { backgroundColor: tokens.color.elevated, borderColor: tokens.color.border, borderRadius: tokens.radius.medium, borderWidth: 1 },
  expanded: { borderColor: tokens.color.gold },
  summary: { alignItems: 'center', flexDirection: 'row', gap: tokens.space.sm, minHeight: 56, paddingHorizontal: tokens.space.md, paddingVertical: 10 },
  copy: { flex: 1, gap: 2 },
  title: { color: tokens.color.primaryText, fontFamily: tokens.font.semibold, fontSize: 15 },
  missing: { color: tokens.color.secondaryText },
  detail: { color: tokens.color.secondaryText, fontFamily: tokens.font.body, fontSize: 12 },
  editor: { gap: tokens.space.sm, paddingBottom: tokens.space.md, paddingHorizontal: tokens.space.md },
});
