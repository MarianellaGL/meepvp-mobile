import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { MeepleAssistStatus, MeepleDisclosure, ScoreButton, ScoreTextField } from '@decodadev02/meepleui';
import { router, useLocalSearchParams } from 'expo-router';

import { useAskRule } from '@/features/games/queries';
import type { RuleCitation } from '@/features/games/api';
import { Hint, Section } from '@/shared/ui/Section';
import { Screen } from '@/shared/ui/Screen';
import { tokens } from '@/theme';

export default function AskRuleScreen() {
  const params = useLocalSearchParams<{ gameId: string; name?: string; question?: string }>();
  const id = Number(params.gameId);
  const gameName = String(params.name ?? 'este juego');
  const [question, setQuestion] = useState(params.question ?? '');
  const ask = useAskRule(id);
  const askedFromGame = useRef(false);

  // A question typed on the game screen is answered right away.
  useEffect(() => {
    if (askedFromGame.current || !params.question || params.question.trim().length < 3) return;
    askedFromGame.current = true;
    ask.mutate(params.question);
  }, [ask, params.question]);

  function submit() {
    if (question.trim().length >= 3) ask.mutate(question);
  }

  const answer = ask.data;
  return <Screen eyebrow={gameName.toLocaleUpperCase()} title="Preguntá sobre las reglas" subtitle="Respondemos con el reglamento y te mostramos de dónde sale." onBack={() => router.back()}
    footer={<ScoreButton label="Preguntar" icon="magnify" loading={ask.isPending} disabled={ask.isPending || question.trim().length < 3} onPress={submit} />}
  >
    <ScoreTextField label="Tu pregunta" placeholder="¿Cómo se desempata?" value={question} onChangeText={setQuestion} returnKeyType="search" onSubmitEditing={submit} />

    {ask.isPending && <MeepleAssistStatus kind="working" title="Leyendo el reglamento" description="La primera pregunta de un juego puede tardar unos segundos." />}
    {ask.error && <MeepleAssistStatus kind="error" title="No pudimos responder" description={ask.error.message} />}
    {answer && !ask.isPending && (answer.found ? <>
      <Section label="RESPUESTA">
        <Text style={styles.answer}>{answer.answer}</Text>
        <Hint>{answer.rulebook.name}{answer.citations.length ? ` · pág. ${answer.citations.map((citation) => citation.page).join(', ')}` : ''}</Hint>
      </Section>
      <Section label="DE DÓNDE SALE">
        {answer.citations.map((citation) => <Citation key={citation.page} citation={citation} />)}
      </Section>
    </> : <MeepleAssistStatus kind="manual" title="No lo encontramos en el reglamento" description="Probá con otras palabras o consultá el reglamento completo." />)}
  </Screen>;
}

function Citation({ citation }: { citation: RuleCitation }) {
  const [expanded, setExpanded] = useState(false);
  const text = citation.text.split(/\s+/).join(' ');
  return <>
    <MeepleDisclosure title={`Página ${citation.page}`} detail={expanded ? undefined : `${text.slice(0, 90)}…`} expanded={expanded} onPress={() => setExpanded((shown) => !shown)} />
    {expanded && <Text style={styles.source}>{text}</Text>}
  </>;
}

const styles = StyleSheet.create({
  answer: { color: tokens.color.primaryText, fontFamily: tokens.font.semibold, fontSize: 16, lineHeight: 23 },
  source: { color: tokens.color.secondaryText, fontFamily: tokens.font.body, fontSize: 13, lineHeight: 19 },
});
