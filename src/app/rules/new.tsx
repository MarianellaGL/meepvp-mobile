import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { Button, IconButton, SegmentedButtons, Switch, Text, TextInput } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { CreateScoringRule, FieldKind } from '@/lib/api';
import { useTableScoreStore } from '@/stores/useTableScoreStore';

type DraftField = { name: string; kind: FieldKind; pointsPerUnit: string };
const emptyField = (): DraftField => ({ name: '', kind: 'checkbox', pointsPerUnit: '1' });

export default function NewRuleScreen() {
  const [gameName, setGameName] = useState(''); const [name, setName] = useState('Standard scoring');
  const [winCondition, setWinCondition] = useState<'highest_total' | 'lowest_total'>('highest_total'); const [isPublic, setIsPublic] = useState(false);
  const [fields, setFields] = useState<DraftField[]>([emptyField()]); const [isSaving, setIsSaving] = useState(false);
  const { createScoringRule, error } = useTableScoreStore();
  const updateField = (index: number, updates: Partial<DraftField>) => setFields((current) => current.map((field, i) => i === index ? { ...field, ...updates } : field));
  async function saveRule() {
    if (!gameName.trim() || fields.some((field) => !field.name.trim())) return;
    const rule: CreateScoringRule = { gameName: gameName.trim(), name: name.trim() || 'Standard scoring', winCondition, isPublic, fields: fields.map((field) => ({ name: field.name.trim(), kind: field.kind, pointsPerUnit: Number(field.pointsPerUnit) || 0 })) };
    setIsSaving(true); try { await createScoringRule(rule); router.back(); } catch { /* The global store retains the error. */ } finally { setIsSaving(false); }
  }
  return <SafeAreaView style={styles.safeArea} edges={['top']}><ScrollView contentContainerStyle={styles.content}>
    <View style={styles.header}><IconButton icon="arrow-left" onPress={() => router.back()} /><Text variant="headlineSmall">New scoring sheet</Text></View>
    <Text variant="bodyMedium" style={styles.copy}>Turn a rulebook into a simple score table your group can actually use.</Text>
    <TextInput label="Game name" value={gameName} onChangeText={setGameName} mode="outlined" style={styles.input} />
    <TextInput label="Scoring sheet name" value={name} onChangeText={setName} mode="outlined" style={styles.input} />
    <Text variant="labelLarge" style={styles.label}>Winner</Text>
    <SegmentedButtons value={winCondition} onValueChange={(value) => setWinCondition(value as typeof winCondition)} buttons={[{ value: 'highest_total', label: 'Highest score' }, { value: 'lowest_total', label: 'Lowest score' }]} />
    <View style={styles.publicRow}><View><Text variant="titleSmall">Share with the community</Text><Text variant="bodySmall">Others can use this scoring sheet.</Text></View><Switch value={isPublic} onValueChange={setIsPublic} /></View>
    <Text variant="titleMedium" style={styles.section}>Score fields</Text>
    {fields.map((field, index) => <View key={index} style={styles.field}><View style={styles.fieldHeader}><Text variant="titleSmall">Field {index + 1}</Text>{fields.length > 1 && <IconButton icon="delete-outline" onPress={() => setFields((current) => current.filter((_, i) => i !== index))} />}</View><TextInput label="Name" value={field.name} onChangeText={(value) => updateField(index, { name: value })} mode="outlined" /><SegmentedButtons value={field.kind} onValueChange={(value) => updateField(index, { kind: value as FieldKind })} buttons={[{ value: 'checkbox', label: 'Check' }, { value: 'counter', label: 'Count' }, { value: 'manual', label: 'Manual' }]} />{field.kind !== 'manual' && <TextInput label="Points per unit" keyboardType="numbers-and-punctuation" value={field.pointsPerUnit} onChangeText={(value) => updateField(index, { pointsPerUnit: value })} mode="outlined" />}</View>)}
    <Button mode="outlined" icon="plus" onPress={() => setFields((current) => [...current, emptyField()])}>Add score field</Button>
    {error && <Text variant="bodySmall" style={styles.error}>{error}</Text>}
    <Button mode="contained" icon="content-save" loading={isSaving} disabled={!gameName.trim() || fields.some((field) => !field.name.trim())} onPress={saveRule} style={styles.save}>Save scoring sheet</Button>
  </ScrollView></SafeAreaView>;
}

const styles = StyleSheet.create({ safeArea: { flex: 1, backgroundColor: '#FFFBFE' }, content: { gap: 14, padding: 20 }, header: { alignItems: 'center', flexDirection: 'row', marginLeft: -12 }, copy: { color: '#625B71' }, input: { marginTop: 4 }, label: { marginTop: 8 }, publicRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginVertical: 8 }, section: { marginTop: 8 }, field: { backgroundColor: '#F6EFFB', borderRadius: 16, gap: 10, padding: 14 }, fieldHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' }, save: { marginTop: 8 }, error: { color: '#BA1A1A' } });
