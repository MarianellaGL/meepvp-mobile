import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Button, IconButton, SegmentedButtons, Switch, Text, TextInput } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { CreateScoringRule, FieldKind } from '@/lib/api';
import { useTableScoreStore } from '@/stores/useTableScoreStore';
import { colors } from '@/theme';

type DraftField = { name: string; kind: FieldKind; pointsPerUnit: string };
const emptyField = (): DraftField => ({ name: '', kind: 'checkbox', pointsPerUnit: '1' });

export default function NewRuleScreen() {
  const { gameId, game: selectedGame, fromPdf, planId } = useLocalSearchParams<{ gameId?: string; game?: string; fromPdf?: string; planId?: string }>();
  const [gameName, setGameName] = useState(selectedGame ?? '');
  const [name, setName] = useState('Standard scoring');
  const [winCondition, setWinCondition] = useState<'highest_total' | 'lowest_total'>('highest_total');
  const [isPublic, setIsPublic] = useState(false);
  const [fields, setFields] = useState<DraftField[]>([emptyField()]);
  const [isSaving, setIsSaving] = useState(false);
  const { createScoringRule, setScheduledGameRule, error, pdfDraft, setPDFDraft } = useTableScoreStore();

  const updateField = (index: number, updates: Partial<DraftField>) =>
    setFields((current) => current.map((field, i) => i === index ? { ...field, ...updates } : field));

  async function saveRule() {
    if (!gameName.trim() || fields.some((field) => !field.name.trim())) return;
    const rule: CreateScoringRule = {
      ...(Number.isSafeInteger(Number(gameId)) && Number(gameId) > 0 ? { bggId: Number(gameId) } : {}),
      gameName: gameName.trim(),
      name: name.trim() || 'Standard scoring',
      winCondition,
      isPublic,
      fields: fields.map((field) => ({
        name: field.name.trim(),
        kind: field.kind,
        pointsPerUnit: Number(field.pointsPerUnit) || 0,
      })),
    };
    setIsSaving(true);
    try {
      const savedRule = await createScoringRule(rule);
      if (fromPdf === '1') setPDFDraft(null);
      if (planId) {
        await setScheduledGameRule(planId, savedRule.id);
        router.replace('/schedule');
      } else {
        router.replace({ pathname: '/sessions/new', params: { ruleId: savedRule.id } });
      }
    }
    catch { /* The store displays the error. */ }
    finally { setIsSaving(false); }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.topRow}><IconButton icon="arrow-left" iconColor={colors.forest} onPress={() => router.back()} /><Text style={styles.topLabel}>NEW SCORE SHEET</Text><View style={styles.topSpacer} /></View>
        <Text style={styles.title}>Make scoring simple.</Text>
        <Text style={styles.subtitle}>Set up the points once. Enjoy the game every time.</Text>

        {fromPdf === '1' && pdfDraft && (
          <View style={styles.formCard}>
            <Text style={styles.sectionLabel}>FROM {pdfDraft.fileName.toUpperCase()}</Text>
            <Text style={styles.shareCopy}>{pdfDraft.scoringExcerpts.length ? 'Use these passages as a reference. Check the PDF before assigning point values.' : 'No scoring passages were found in the selectable text.'}</Text>
            {pdfDraft.scoringExcerpts.slice(0, 5).map((excerpt, index) => <Text key={`${index}-${excerpt.slice(0, 10)}`} style={styles.pdfExcerpt}>{excerpt}</Text>)}
          </View>
        )}

        <View style={styles.formCard}>
          <Text style={styles.sectionLabel}>THE BASICS</Text>
          <TextInput label="Game name" value={gameName} onChangeText={setGameName} mode="outlined" />
          <TextInput label="Scoring sheet name" value={name} onChangeText={setName} mode="outlined" />
          <Text style={styles.fieldLabel}>Who wins?</Text>
          <SegmentedButtons value={winCondition} onValueChange={(value) => setWinCondition(value as typeof winCondition)} buttons={[{ value: 'highest_total', label: 'Highest score' }, { value: 'lowest_total', label: 'Lowest score' }]} />
        </View>

        <View style={styles.shareCard}>
          <View style={styles.shareText}><Text style={styles.shareTitle}>Share with the community</Text><Text style={styles.shareCopy}>Let others use this sheet.</Text></View>
          <Switch value={isPublic} onValueChange={setIsPublic} />
        </View>

        <View style={styles.sectionHeader}><View><Text style={styles.sectionLabel}>BUILD THE SCORE</Text><Text variant="headlineSmall" style={styles.heading}>Score fields</Text></View><Text style={styles.fieldCount}>{fields.length} total</Text></View>
        {fields.map((field, index) => (
          <View key={index} style={styles.fieldCard}>
            <View style={styles.fieldHeader}><Text style={styles.fieldNumber}>FIELD {index + 1}</Text>{fields.length > 1 && <IconButton icon="delete-outline" iconColor={colors.error} onPress={() => setFields((current) => current.filter((_, i) => i !== index))} />}</View>
            <TextInput label="Field name" placeholder="Coins, goals, penalties…" value={field.name} onChangeText={(value) => updateField(index, { name: value })} mode="outlined" />
            <SegmentedButtons value={field.kind} onValueChange={(value) => updateField(index, { kind: value as FieldKind })} buttons={[{ value: 'checkbox', label: 'Check' }, { value: 'counter', label: 'Count' }, { value: 'manual', label: 'Manual' }]} />
            {field.kind !== 'manual' && <TextInput label="Points per unit" keyboardType="numbers-and-punctuation" value={field.pointsPerUnit} onChangeText={(value) => updateField(index, { pointsPerUnit: value })} mode="outlined" />}
          </View>
        ))}
        <Button mode="outlined" icon="plus" onPress={() => setFields((current) => [...current, emptyField()])}>Add a field</Button>
        {error && <Text style={styles.error}>{error}</Text>}
        <Button mode="contained" icon="content-save-outline" loading={isSaving} disabled={!gameName.trim() || fields.some((field) => !field.name.trim())} onPress={saveRule} style={styles.save}>{planId ? 'Save sheet for scheduled game' : 'Save and choose players'}</Button>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.canvas },
  content: { gap: 13, padding: 20, paddingBottom: 40 },
  topRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginLeft: -12 },
  topLabel: { color: colors.orangeInk, fontSize: 10, fontWeight: '800', letterSpacing: 1.4 },
  topSpacer: { width: 40 },
  title: { color: colors.ink, fontSize: 32, fontWeight: '800', letterSpacing: -1.1, marginTop: 6 },
  subtitle: { color: colors.muted, fontSize: 15, lineHeight: 21, marginBottom: 10 },
  formCard: { backgroundColor: colors.paper, borderColor: colors.line, borderRadius: 23, borderWidth: 1, gap: 14, padding: 17 },
  sectionLabel: { color: colors.orangeInk, fontSize: 10, fontWeight: '800', letterSpacing: 1.4 },
  fieldLabel: { color: colors.ink, fontSize: 14, fontWeight: '700', marginTop: 3 },
  shareCard: { alignItems: 'center', backgroundColor: colors.mint, borderRadius: 19, flexDirection: 'row', gap: 10, padding: 15 },
  shareText: { flex: 1 },
  shareTitle: { color: colors.ink, fontSize: 14, fontWeight: '800' },
  shareCopy: { color: colors.muted, fontSize: 12, marginTop: 3 },
  sectionHeader: { alignItems: 'flex-end', flexDirection: 'row', justifyContent: 'space-between', marginTop: 13 },
  heading: { color: colors.ink, fontWeight: '800', marginTop: 3 },
  fieldCount: { color: colors.muted, fontSize: 12, fontWeight: '700' },
  fieldCard: { backgroundColor: colors.paper, borderColor: colors.line, borderRadius: 21, borderWidth: 1, gap: 12, padding: 16 },
  fieldHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', minHeight: 20 },
  fieldNumber: { color: colors.forest, fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  save: { marginTop: 8 },
  error: { color: colors.error },
  pdfExcerpt: { color: colors.ink, fontSize: 12, lineHeight: 18 },
});
