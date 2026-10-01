import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ScoreSwitch, ScoreTextField as TextInput } from '@decodadev02/meepleui';
import { IconButton, SegmentedButtons, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { CreateScoringRule, FieldKind } from '@/lib/api';
import { extractScoringDraft } from '@/lib/scoringDraft';
import { useTableScoreStore } from '@/stores/useTableScoreStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { colors, tokens } from '@/theme';
import { AppButton as Button } from '@/components/AppButton';
import { AssistStatus } from '@/components/AssistStatus';

type DraftField = { name: string; kind: FieldKind; pointsPerUnit: string };
const emptyField = (): DraftField => ({ name: '', kind: 'checkbox', pointsPerUnit: '1' });

export default function NewRuleScreen() {
  const { gameId, game: selectedGame, fromPdf, fromImage, planId, flow } = useLocalSearchParams<{ gameId?: string; game?: string; fromPdf?: string; fromImage?: string; planId?: string; flow?: string }>();
  const { createScoringRule, setScheduledGameRule, error, pdfDraft, setPDFDraft } = useTableScoreStore();
  const importedDraft = (fromPdf === '1' || fromImage === '1') && pdfDraft ? extractScoringDraft(pdfDraft) : null;
  const [gameName, setGameName] = useState(selectedGame ?? importedDraft?.gameName ?? '');
  const [name, setName] = useState('Puntuación estándar');
  const [winCondition, setWinCondition] = useState<'highest_total' | 'lowest_total'>('highest_total');
  const [isPublic, setIsPublic] = useState(false);
  const [fields, setFields] = useState<DraftField[]>(() => importedDraft?.fields.map((field) => ({ ...field, pointsPerUnit: String(field.pointsPerUnit) })) ?? [emptyField()]);
  const [isSaving, setIsSaving] = useState(false);
  const account = useAuthStore((state) => state.user);

  const updateField = (index: number, updates: Partial<DraftField>) =>
    setFields((current) => current.map((field, i) => i === index ? { ...field, ...updates } : field));

  async function saveRule() {
    if (!gameName.trim() || fields.some((field) => !field.name.trim())) return;
    const rule: CreateScoringRule = {
      ...(fromPdf === '1' && pdfDraft?.rulebook ? { rulebookId: pdfDraft.rulebook.id } : {}),
      ...(Number.isSafeInteger(Number(gameId)) && Number(gameId) > 0 ? { bggId: Number(gameId) } : {}),
      gameName: gameName.trim(),
      name: name.trim() || 'Puntuación estándar',
      winCondition,
      isPublic: isPublic && !!account,
      fields: fields.map((field) => ({
        name: field.name.trim(),
        kind: field.kind,
        pointsPerUnit: Number(field.pointsPerUnit) || 0,
      })),
    };
    setIsSaving(true);
    try {
      const savedRule = await createScoringRule(rule);
      if (fromPdf === '1' || fromImage === '1') setPDFDraft(null);
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
        <View style={styles.topRow}><IconButton icon="arrow-left" iconColor={colors.forest} onPress={() => router.back()} /><Text style={styles.topLabel}>{flow === 'setup' ? 'PARTIDA · PLANILLA' : 'NUEVA PLANILLA'}</Text><View style={styles.topSpacer} /></View>
        <Text style={styles.title}>{fromPdf === '1' || fromImage === '1' ? 'Revisá la planilla' : 'Armá tu planilla'}</Text>
        <Text style={styles.subtitle}>Confirmá los campos y sus puntos antes de guardar.</Text>
        {flow === 'setup' && <View accessibilityLabel="Paso 5 de 5" style={styles.progressTrack}><View style={styles.progressFill} /></View>}

        {(fromPdf === '1' || fromImage === '1') && pdfDraft && (
          <View style={styles.formCard}>
            <Text style={styles.sectionLabel}>DESDE {pdfDraft.fileName.toUpperCase()}</Text>
            {importedDraft ? <>
              <AssistStatus kind="ready" title={pdfDraft.scoringSuggestion?.source === 'ai' ? 'Propuesta asistida por IA' : 'Campos importados para revisar'} description={`Cargamos ${importedDraft.fields.length} campos. Confirmá cada multiplicador y modificá lo que haga falta antes de guardar.`} />
              {importedDraft.notes.map((note) => <Text key={note} style={styles.shareCopy}>{note}</Text>)}
            </> : <>
              <AssistStatus title="Armá la planilla con el texto" description={pdfDraft.scoringExcerpts.length ? `Usá estos fragmentos como referencia y revisá ${fromImage === '1' ? 'la imagen' : 'el PDF'} antes de asignar puntos.` : 'No encontramos fragmentos sobre puntuación. Agregá los campos según el reglamento.'} />
              {pdfDraft.scoringExcerpts.slice(0, 5).map((excerpt, index) => <Text key={`${index}-${excerpt.slice(0, 10)}`} style={styles.pdfExcerpt}>{excerpt}</Text>)}
            </>}
          </View>
        )}

        <View style={styles.formCard}>
          <Text style={styles.sectionLabel}>LO BÁSICO</Text>
          <TextInput label="Nombre del juego" value={gameName} onChangeText={setGameName} mode="outlined" />
          <TextInput label="Nombre de la planilla" value={name} onChangeText={setName} mode="outlined" />
          <Text style={styles.fieldLabel}>¿Quién gana?</Text>
          <SegmentedButtons value={winCondition} onValueChange={(value) => setWinCondition(value as typeof winCondition)} buttons={[{ value: 'highest_total', label: 'Más puntos' }, { value: 'lowest_total', label: 'Menos puntos' }]} />
        </View>

        <View style={styles.shareCard}>
          <ScoreSwitch label="Compartir planilla con la comunidad" value={isPublic && !!account} onChange={setIsPublic} disabled={!account} />
          {!account && <View style={styles.sharePrompt}>
            <Text style={styles.shareCopy}>Iniciá sesión para publicar una planilla en la comunidad.</Text>
            <Button mode="text" style={styles.loginButton} onPress={() => router.push('/auth')}>Iniciar sesión o registrarse</Button>
          </View>}
        </View>

        <View style={styles.sectionHeader}><View><Text style={styles.sectionLabel}>ARMÁ LA PUNTUACIÓN</Text><Text variant="headlineSmall" style={styles.heading}>Campos de puntos</Text></View><Text style={styles.fieldCount}>{fields.length} en total</Text></View>
        {fields.map((field, index) => (
          <View key={index} style={styles.fieldCard}>
            <View style={styles.fieldHeader}><Text style={styles.fieldNumber}>CAMPO {index + 1}</Text>{fields.length > 1 && <IconButton icon="delete-outline" iconColor={colors.error} onPress={() => setFields((current) => current.filter((_, i) => i !== index))} />}</View>
            <TextInput label="Nombre del campo" placeholder="Monedas, objetivos, penalizaciones…" value={field.name} onChangeText={(value) => updateField(index, { name: value })} mode="outlined" />
            <SegmentedButtons value={field.kind} onValueChange={(value) => updateField(index, { kind: value as FieldKind })} buttons={[{ value: 'checkbox', label: 'Marca' }, { value: 'counter', label: 'Contador' }, { value: 'manual', label: 'Manual' }]} />
            {field.kind !== 'manual' && <TextInput label="Puntos por unidad" keyboardType="numbers-and-punctuation" value={field.pointsPerUnit} onChangeText={(value) => updateField(index, { pointsPerUnit: value })} mode="outlined" />}
          </View>
        ))}
        <Button mode="outlined" icon="plus" onPress={() => setFields((current) => [...current, emptyField()])}>Agregar campo</Button>
        {error && <Text style={styles.error}>{error}</Text>}
      </ScrollView>
      <View style={styles.bottomAction}><Button mode="contained" icon="content-save-outline" loading={isSaving} disabled={!gameName.trim() || fields.some((field) => !field.name.trim()) || isSaving} onPress={saveRule}>{planId ? 'Guardar para la partida programada' : 'Guardar planilla'}</Button></View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.canvas },
  content: { gap: 13, padding: 24, paddingBottom: 40 },
  topRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginLeft: -12 },
  topLabel: { color: colors.orangeInk, fontSize: 10, fontWeight: '800', letterSpacing: 1.4 },
  topSpacer: { width: 40 },
  title: { color: colors.ink, fontFamily: tokens.font.heading, fontSize: 27, lineHeight: 35, marginTop: 6 },
  subtitle: { color: colors.muted, fontSize: 15, lineHeight: 21, marginBottom: 10 },
  formCard: { backgroundColor: colors.paper, borderColor: colors.line, borderRadius: 23, borderWidth: 1, gap: 14, padding: 17 },
  sectionLabel: { color: colors.orangeInk, fontSize: 10, fontWeight: '800', letterSpacing: 1.4 },
  fieldLabel: { color: colors.ink, fontSize: 14, fontWeight: '700', marginTop: 3 },
  shareCard: { backgroundColor: colors.mint, borderRadius: 19, gap: 8, padding: 15 },
  sharePrompt: { alignItems: 'flex-start', gap: 2 },
  loginButton: { alignSelf: 'flex-start' },
  shareText: { flex: 1 },
  shareTitle: { color: colors.ink, fontSize: 14, fontWeight: '800' },
  shareCopy: { color: colors.muted, fontSize: 12, marginTop: 3 },
  sectionHeader: { alignItems: 'flex-end', flexDirection: 'row', justifyContent: 'space-between', marginTop: 13 },
  heading: { color: colors.ink, fontWeight: '800', marginTop: 3 },
  fieldCount: { color: colors.muted, fontSize: 12, fontWeight: '700' },
  fieldCard: { backgroundColor: colors.paper, borderColor: colors.line, borderRadius: 21, borderWidth: 1, gap: 12, padding: 16 },
  fieldHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', minHeight: 20 },
  fieldNumber: { color: colors.forest, fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  progressTrack: { backgroundColor: colors.line, borderRadius: 4, height: 5, marginTop: 8, marginBottom: 8, overflow: 'hidden' },
  progressFill: { backgroundColor: colors.orangeInk, height: '100%', width: '100%' },
  bottomAction: { backgroundColor: colors.canvas, paddingHorizontal: 24, paddingVertical: 12 },
  error: { color: colors.error },
  pdfExcerpt: { color: colors.ink, fontSize: 12, lineHeight: 18 },
});
