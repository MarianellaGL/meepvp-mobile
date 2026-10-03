import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { MeepleDisclosure, ScoreButton, ScoreCheckbox, ScoreStepper } from '@decodadev02/meepleui';

import type { ScoreField } from '@/lib/api';
import { Hint } from '@/shared/ui/Section';
import { tokens } from '@/theme';

type ScoreSheetProps = {
  fields: ScoreField[];
  values: Record<string, number>;
  manualPoints: number;
  disabled: boolean;
  onScore: (fieldId: string, value: number) => Promise<void>;
  onAdjust: (delta: number) => Promise<void>;
};

const points = (value: number) => `${value} ${Math.abs(value) === 1 ? 'pt' : 'pts'}`;

/** The person's own scores, one control per category of the sheet. */
export function ScoreSheet({ fields, values, manualPoints, disabled, onScore, onAdjust }: ScoreSheetProps) {
  const [showAdjust, setShowAdjust] = useState(manualPoints !== 0);
  return <View style={styles.sheet}>
    {fields.map((field) => {
      const value = values[field.id] ?? 0;
      const save = (next: number) => { onScore(field.id, next).catch(() => undefined); };
      if (field.kind === 'checkbox') {
        return <ScoreCheckbox key={field.id} label={`${field.name} · ${field.pointsPerUnit > 0 ? '+' : ''}${points(field.pointsPerUnit)}`} checked={value > 0} disabled={disabled} onChange={(checked) => save(checked ? 1 : 0)} />;
      }
      if (field.kind === 'counter') {
        return <ScoreStepper key={field.id} player={field.name} detail={`${points(field.pointsPerUnit)} cada uno · ${points(value * field.pointsPerUnit)}`} value={value} min={0} max={9999} disabled={disabled} onChange={save} />;
      }
      return <ManualScore key={field.id} name={field.name} value={value} disabled={disabled} onSave={save} />;
    })}
    <MeepleDisclosure title="Ajuste rápido" detail={manualPoints ? `${manualPoints > 0 ? '+' : ''}${points(manualPoints)} fuera de la planilla` : 'Sumar o restar puntos sueltos'} expanded={showAdjust} onPress={() => setShowAdjust((shown) => !shown)} />
    {showAdjust && <QuickAdjust disabled={disabled} onAdjust={onAdjust} />}
  </View>;
}

/** A free total: the person types the final number for this category. */
function ManualScore({ name, value, disabled, onSave }: { name: string; value: number; disabled: boolean; onSave: (value: number) => void }) {
  const [draft, setDraft] = useState<string | null>(null);
  const [invalid, setInvalid] = useState(false);
  function commit() {
    if (draft === null) return;
    const next = Number(draft);
    setDraft(null);
    if (draft.trim() === '' || !Number.isSafeInteger(next) || Math.abs(next) > 99999) { setInvalid(true); return; }
    setInvalid(false);
    if (next !== value) onSave(next);
  }
  return <View style={styles.manual}>
    <View style={styles.manualCopy}>
      <Text style={styles.manualName}>{name}</Text>
      <Text style={[styles.manualDetail, invalid && styles.invalid]}>{invalid ? 'Escribí un número entero' : 'Total de esta categoría'}</Text>
    </View>
    <TextInput
      value={draft ?? String(value)}
      onFocus={() => setDraft(String(value))}
      onChangeText={(text) => { if (/^-?\d{0,5}$/.test(text)) setDraft(text); }}
      onBlur={commit}
      onSubmitEditing={commit}
      editable={!disabled}
      keyboardType="numbers-and-punctuation"
      returnKeyType="done"
      selectTextOnFocus
      accessibilityLabel={`${name}: puntos`}
      style={[styles.manualInput, disabled && styles.disabled]}
    />
  </View>;
}

function QuickAdjust({ disabled, onAdjust }: { disabled: boolean; onAdjust: (delta: number) => Promise<void> }) {
  const [amount, setAmount] = useState('1');
  const [saving, setSaving] = useState(false);
  const [failed, setFailed] = useState(false);
  const value = Number(amount);
  const valid = Number.isSafeInteger(value) && value > 0 && value <= 10000;
  async function change(sign: 1 | -1) {
    if (!valid || disabled || saving) return;
    setSaving(true);
    setFailed(false);
    try { await onAdjust(sign * value); } catch { setFailed(true); } finally { setSaving(false); }
  }
  return <View style={styles.adjust}>
    <TextInput value={amount} onChangeText={(text) => { if (/^\d{0,5}$/.test(text)) setAmount(text); }} keyboardType="number-pad" accessibilityLabel="Puntos a ajustar" style={[styles.manualInput, styles.adjustInput]} />
    <View style={styles.adjustButton}><ScoreButton label="Sumar" icon="plus" disabled={disabled || saving || !valid} onPress={() => void change(1)} /></View>
    <View style={styles.adjustButton}><ScoreButton label="Restar" icon="minus" variant="secondary" disabled={disabled || saving || !valid} onPress={() => void change(-1)} /></View>
    {failed && <Hint tone="error">No pudimos guardar el ajuste. Reintentá.</Hint>}
  </View>;
}

const styles = StyleSheet.create({
  sheet: { gap: tokens.space.sm },
  manual: { alignItems: 'center', backgroundColor: tokens.color.elevated, borderRadius: tokens.radius.medium, flexDirection: 'row', gap: tokens.space.sm, minHeight: 64, paddingHorizontal: tokens.space.md, paddingVertical: 10 },
  manualCopy: { flex: 1, gap: 2 },
  manualName: { color: tokens.color.primaryText, fontFamily: tokens.font.semibold, fontSize: 15 },
  manualDetail: { color: tokens.color.secondaryText, fontFamily: tokens.font.body, fontSize: 12 },
  invalid: { color: tokens.color.warning },
  manualInput: { backgroundColor: tokens.color.canvas, borderColor: tokens.color.border, borderRadius: tokens.radius.small, borderWidth: 1, color: tokens.color.primaryText, fontFamily: tokens.font.semibold, fontSize: 20, minWidth: 84, paddingHorizontal: 10, paddingVertical: 8, textAlign: 'center' },
  disabled: { opacity: 0.5 },
  adjust: { alignItems: 'center', flexDirection: 'row', flexWrap: 'wrap', gap: tokens.space.sm },
  adjustInput: { minWidth: 70 },
  adjustButton: { flex: 1, minWidth: 110 },
});
