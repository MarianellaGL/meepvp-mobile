import { useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { ScoreButton, ScoreStepper } from '@decodadev02/meepleui';

import { fieldPoints, rowHint, type SheetRow } from '@/features/sessions/sheet';
import { Hint } from '@/shared/ui/Section';
import { tokens } from '@/theme';

type CellEditorProps = {
  row: SheetRow;
  playerName: string;
  value: number;
  nextPlayerName?: string;
  onSave: (value: number) => Promise<void>;
  onNext: () => void;
  onClose: () => void;
};

const points = (value: number) => `${value} ${Math.abs(value) === 1 ? 'pt' : 'pts'}`;

/** Fills one square of the sheet: a quantity for counters, a number for totals. */
export function CellEditor({ row, playerName, value, nextPlayerName, onSave, onNext, onClose }: CellEditorProps) {
  const [draft, setDraft] = useState(String(value));
  const [saving, setSaving] = useState(false);
  const [failed, setFailed] = useState(false);
  const number = draft.trim() === '' || draft === '-' ? null : Number(draft);
  const valid = number !== null && Number.isSafeInteger(number) && Math.abs(number) <= 99999 && (row.kind !== 'counter' || number >= 0);

  async function save(then: () => void) {
    if (!valid || saving) return;
    setSaving(true);
    setFailed(false);
    try {
      if (number !== value) await onSave(number);
      then();
    } catch { setFailed(true); } finally { setSaving(false); }
  }

  return <Modal transparent animationType="slide" visible onRequestClose={onClose}>
    <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Cerrar" />
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.panel}>
        <Text style={styles.player}>{playerName}</Text>
        <Text style={styles.title}>{row.name}</Text>
        <Text style={styles.hint}>{rowHint(row)}</Text>

        {row.kind === 'counter'
          ? <ScoreStepper player="Cantidad" detail={`= ${points(fieldPoints(row.kind, row.pointsPerUnit, number ?? 0))}`} value={number ?? 0} min={0} max={9999} disabled={saving} onChange={(next) => setDraft(String(next))} />
          : <TextInput
              value={draft}
              onChangeText={(text) => { if (/^-?\d{0,5}$/.test(text)) setDraft(text); }}
              onSubmitEditing={() => void save(nextPlayerName ? onNext : onClose)}
              autoFocus
              selectTextOnFocus
              keyboardType="numbers-and-punctuation"
              returnKeyType={nextPlayerName ? 'next' : 'done'}
              accessibilityLabel={`${row.name} de ${playerName}: puntos`}
              style={styles.input}
            />}

        {failed && <Hint tone="error">No pudimos guardar. Reintentá.</Hint>}
        <View style={styles.actions}>
          {nextPlayerName
            ? <>
                <View style={styles.action}><ScoreButton label="Listo" variant="secondary" disabled={!valid || saving} onPress={() => void save(onClose)} /></View>
                <View style={styles.action}><ScoreButton label={`Sigue ${nextPlayerName}`} icon="arrow-right" loading={saving} disabled={!valid || saving} onPress={() => void save(onNext)} /></View>
              </>
            : <View style={styles.action}><ScoreButton label="Listo" icon="check" loading={saving} disabled={!valid || saving} onPress={() => void save(onClose)} /></View>}
        </View>
      </View>
    </KeyboardAvoidingView>
  </Modal>;
}

const styles = StyleSheet.create({
  backdrop: { backgroundColor: 'rgba(0,0,0,0.55)', flex: 1 },
  panel: { backgroundColor: tokens.color.surface, borderColor: tokens.color.border, borderTopLeftRadius: tokens.radius.large, borderTopRightRadius: tokens.radius.large, borderWidth: 1, gap: tokens.space.sm, padding: tokens.space.lg, paddingBottom: tokens.space.xl },
  player: { color: tokens.color.gold, fontFamily: tokens.font.semibold, fontSize: 12, letterSpacing: 1.2, textTransform: 'uppercase' },
  title: { color: tokens.color.primaryText, fontFamily: tokens.font.heading, fontSize: 22 },
  hint: { color: tokens.color.secondaryText, fontFamily: tokens.font.body, fontSize: 13, marginBottom: tokens.space.sm },
  input: { backgroundColor: tokens.color.canvas, borderColor: tokens.color.border, borderRadius: tokens.radius.medium, borderWidth: 1, color: tokens.color.primaryText, fontFamily: tokens.font.semibold, fontSize: 32, paddingVertical: 12, textAlign: 'center' },
  actions: { flexDirection: 'row', gap: tokens.space.sm, marginTop: tokens.space.sm },
  action: { flex: 1 },
});
