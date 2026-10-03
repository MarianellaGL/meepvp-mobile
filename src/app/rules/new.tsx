import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { MeepleAssistStatus, MeepleDisclosure, ScoreButton, ScoreDropdown, ScoreSwitch, ScoreTextField } from '@decodadev02/meepleui';

import { FieldRow } from '@/features/sheets/components/FieldRow';
import { draftFromSuggestion, draftProblems, emptyField, toCreateRule, withSuggestedFields, type DraftField, type SheetDraft, type WinCondition } from '@/features/sheets/draft';
import { useProposeSheet, useSaveSheet } from '@/features/sheets/queries';
import { extractScoringDraft } from '@/lib/scoringDraft';
import { Hint, Section } from '@/shared/ui/Section';
import { Screen } from '@/shared/ui/Screen';
import { useAuthStore } from '@/stores/useAuthStore';
import { useTableScoreStore } from '@/stores/useTableScoreStore';
import { tokens } from '@/theme';

const winOptions = [{ value: 'highest_total', label: 'Gana quien suma más' }, { value: 'lowest_total', label: 'Gana quien suma menos' }];

export default function SheetEditorScreen() {
  const { gameId, game, fromPdf, fromImage, planId, flow } = useLocalSearchParams<{ gameId?: string; game?: string; fromPdf?: string; fromImage?: string; planId?: string; flow?: string }>();
  const pdfDraft = useTableScoreStore((state) => state.pdfDraft);
  const account = useAuthStore((state) => state.user);
  const source = (fromPdf === '1' || fromImage === '1') ? pdfDraft : null;
  const detected = source ? extractScoringDraft(source) : null;
  const [draft, setDraft] = useState<SheetDraft>(() => draftFromSuggestion(game ?? '', detected));
  // A fresh sheet opens its first category; a detected one starts collapsed for review.
  const [expanded, setExpanded] = useState<string | null>(detected ? null : draft.fields[0]?.key ?? null);
  const [showSource, setShowSource] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [triedToSave, setTriedToSave] = useState(false);
  const save = useSaveSheet();
  const propose = useProposeSheet();
  const problems = draftProblems(draft);
  const sourceName = source?.rulebook?.name ?? source?.fileName;
  const notes = propose.data?.scoringSuggestion?.notes ?? detected?.notes ?? [];
  const proposalText = source ? [source.scoringExcerpts.join('\n'), source.text].filter(Boolean).join('\n\n').slice(0, 120_000) : '';
  const hasNamedFields = draft.fields.some((field) => field.name.trim());

  const update = (changes: Partial<SheetDraft>) => setDraft((current) => ({ ...current, ...changes }));
  const updateField = (key: string, changes: Partial<DraftField>) =>
    setDraft((current) => ({ ...current, fields: current.fields.map((field) => field.key === key ? { ...field, ...changes } : field) }));

  function addField() {
    const field = emptyField();
    setDraft((current) => ({ ...current, fields: [...current.fields, field] }));
    setExpanded(field.key);
  }

  function proposeWithAI() {
    propose.mutate({ gameName: draft.gameName.trim(), text: proposalText }, {
      onSuccess: ({ scoringSuggestion }) => {
        if (!scoringSuggestion?.fields.length) return;
        setDraft((current) => withSuggestedFields(current, scoringSuggestion));
        setExpanded(null);
      },
    });
  }

  function saveAndPlay() {
    setTriedToSave(true);
    if (problems.length) return;
    const rule = toCreateRule(draft, { bggId: Number(gameId), rulebookId: fromPdf === '1' ? source?.rulebook?.id : undefined, canPublish: !!account });
    save.mutate(rule, {
      onSuccess: async (saved) => {
        if (source) useTableScoreStore.getState().setPDFDraft(null);
        if (planId) {
          await useTableScoreStore.getState().setScheduledGameRule(planId, saved.id).catch(() => undefined);
          router.replace('/schedule');
        } else {
          router.replace({ pathname: '/sessions/new', params: { ruleId: saved.id } });
        }
      },
    });
  }

  return <Screen
    eyebrow={flow === 'setup' ? 'PARTIDA · PLANILLA' : 'PLANILLA'}
    title={draft.gameName.trim() || 'Nueva planilla'}
    subtitle={sourceName ? `Desde ${sourceName}. Revisá los puntos antes de jugar.` : 'Definí cómo se suman los puntos.'}
    onBack={() => router.back()}
    footer={<>
      {triedToSave && problems.length > 0 && <Hint tone="error">{problems[0]}</Hint>}
      {save.error && <Hint tone="error">{save.error.message}</Hint>}
      <ScoreButton label={planId ? 'Guardar para la partida programada' : 'Guardar y jugar'} icon="play" loading={save.isPending} disabled={save.isPending} onPress={saveAndPlay} />
    </>}
  >
    {!game && <ScoreTextField label="Juego" placeholder="Everdell, Catan…" value={draft.gameName} onChangeText={(gameName) => update({ gameName })} />}

    {source && !hasNamedFields && !propose.isPending && <MeepleAssistStatus kind="manual" title="No encontramos una tabla de puntos" description="Pedí una propuesta a la IA a partir del reglamento, o armá las categorías vos." />}
    {propose.isPending && <MeepleAssistStatus kind="working" title="Leyendo el reglamento" description="Preparamos las categorías para que las revises." />}
    {propose.error && <MeepleAssistStatus kind="error" title="No pudimos proponer la planilla" description={propose.error.message} />}
    {propose.data && !propose.data.scoringSuggestion && <MeepleAssistStatus kind="manual" title="La IA no encontró cómo se puntúa" description="Armá las categorías con el reglamento a mano." />}
    {source && !hasNamedFields && <ScoreButton label="Proponer con IA" variant="secondary" icon="auto-fix" loading={propose.isPending} disabled={propose.isPending || proposalText.length < 40 || !draft.gameName.trim()} onPress={proposeWithAI} />}

    <Section label={`CATEGORÍAS · ${draft.fields.length}`}>
      {draft.fields.map((field) => <FieldRow
        key={field.key}
        field={field}
        expanded={expanded === field.key}
        onToggle={() => setExpanded((current) => current === field.key ? null : field.key)}
        onChange={(changes) => updateField(field.key, changes)}
        onRemove={draft.fields.length > 1 ? () => setDraft((current) => ({ ...current, fields: current.fields.filter((item) => item.key !== field.key) })) : undefined}
      />)}
      <ScoreButton label="Añadir categoría" variant="tertiary" icon="plus" onPress={addField} />
    </Section>

    {notes.length > 0 && <Section label="PARA REVISAR">
      {notes.map((note) => <Hint key={note}>• {note}</Hint>)}
    </Section>}

    {source && source.scoringExcerpts.length > 0 && <>
      <MeepleDisclosure title="Lo que dice el reglamento" detail="Fragmentos sobre puntuación" expanded={showSource} onPress={() => setShowSource((shown) => !shown)} />
      {showSource && source.scoringExcerpts.slice(0, 8).map((excerpt, index) => <Text key={`${index}-${excerpt.slice(0, 12)}`} style={styles.excerpt}>{excerpt}</Text>)}
    </>}

    <MeepleDisclosure title="Ajustes" detail={`${draft.name} · ${draft.winCondition === 'lowest_total' ? 'gana quien suma menos' : 'gana quien suma más'}`} expanded={showSettings} onPress={() => setShowSettings((shown) => !shown)} />
    {showSettings && <Section label="AJUSTES">
      <ScoreTextField label="Nombre de la planilla" value={draft.name} onChangeText={(name) => update({ name })} />
      <ScoreDropdown label="¿Quién gana?" value={draft.winCondition} options={winOptions} onChange={(value) => update({ winCondition: value as WinCondition })} />
      <ScoreSwitch label="Compartir con la comunidad" value={draft.isPublic && !!account} disabled={!account} onChange={(isPublic) => update({ isPublic })} />
      {!account && <Hint>Iniciá sesión para compartir planillas.</Hint>}
    </Section>}
  </Screen>;
}

const styles = StyleSheet.create({
  excerpt: { color: tokens.color.secondaryText, fontFamily: tokens.font.body, fontSize: 13, lineHeight: 19 },
});
