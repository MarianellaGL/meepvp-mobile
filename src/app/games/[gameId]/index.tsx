import { useState } from 'react';
import { Image, StyleSheet } from 'react-native';
import { MeepleLibraryEntry, ScoreButton, ScoreSkeleton, ScoreTextField } from '@decodadev02/meepleui';
import { router, useLocalSearchParams } from 'expo-router';

import { useGame, useGameSheets } from '@/features/games/queries';
import { Hint, Section } from '@/shared/ui/Section';
import { Screen } from '@/shared/ui/Screen';
import { useTableScoreStore } from '@/stores/useTableScoreStore';
import { tokens } from '@/theme';

export default function GameScreen() {
  const { gameId, name, imageUrl, flow } = useLocalSearchParams<{ gameId: string; name?: string; imageUrl?: string; flow?: string }>();
  const id = Number(gameId);
  const collected = useTableScoreStore((state) => state.collection.find((item) => item.bggId === id));
  const savedPDF = useTableScoreStore((state) => state.savedPDFs.find((pdf) => pdf.gameId === id));
  const gameName = String(name ?? collected?.name ?? 'Juego');
  const game = useGame(id, gameName);
  const sheets = useGameSheets(id, gameName);
  const [question, setQuestion] = useState('');
  const gameParams = { gameId: String(id), game: gameName, ...(flow === 'setup' ? { flow: 'setup' } : {}) };
  const cover = collected?.imageUrl || collected?.thumbnailUrl || imageUrl;
  const players = collected?.minPlayers && collected?.maxPlayers ? `${collected.minPlayers}–${collected.maxPlayers} jugadores` : undefined;
  const rulebook = game.data?.rulebooks[0];

  function ask() {
    if (question.trim().length < 3) return;
    router.push({ pathname: '/games/[gameId]/ask', params: { gameId: String(id), name: gameName, question: question.trim() } });
  }

  return <Screen
    eyebrow={flow === 'setup' ? 'PARTIDA · PLANILLA' : 'JUEGO'}
    title={gameName}
    subtitle={[collected?.yearPublished, players].filter(Boolean).join(' · ') || undefined}
    onBack={() => router.back()}
    footer={<ScoreButton label={`Crear planilla para ${gameName}`} icon="plus" onPress={() => router.push({ pathname: '/games/sources', params: gameParams })} />}
  >
    {cover && <Image source={{ uri: cover }} style={styles.cover} resizeMode="cover" accessibilityLabel={`Carátula de ${gameName}`} />}

    <ScoreTextField label="Preguntá algo de las reglas" placeholder="¿Cómo se desempata?" value={question} onChangeText={setQuestion} returnKeyType="search" onSubmitEditing={ask} />

    <Section label="REGLAS">
      {game.isPending ? <ScoreSkeleton variant="list" /> : rulebook ? (
        <MeepleLibraryEntry title={rulebook.name} detail={rulebook.textReady ? 'Listo para tus preguntas' : 'Se lee la primera vez que preguntes'} onPress={() => router.push({ pathname: '/games/[gameId]/ask', params: { gameId: String(id), name: gameName } })} />
      ) : <>
        <Hint>Todavía no hay un reglamento vinculado a este juego.</Hint>
        <MeepleLibraryEntry title="Buscar el reglamento" detail="Elegí la edición correcta" onPress={() => router.push({ pathname: '/rulebooks', params: gameParams })} />
      </>}
      {game.error && <Hint tone="error">{game.error.message}</Hint>}
    </Section>

    <Section label="PLANILLAS">
      {game.isPending && !sheets.length ? <ScoreSkeleton variant="list" /> : sheets.length ? sheets.map((sheet) => (
        <MeepleLibraryEntry key={sheet.id} title={sheet.name} detail={`${sheet.fields.length} categorías · Jugar`} onPress={() => router.push({ pathname: '/sessions/new', params: { ruleId: sheet.id } })} />
      )) : <Hint>Todavía no hay planillas para este juego. Creá la primera.</Hint>}
      {savedPDF && <MeepleLibraryEntry title="PDF guardado" detail={savedPDF.document.fileName} onPress={() => router.push({ pathname: '/pdf/reader', params: gameParams })} />}
    </Section>
  </Screen>;
}

const styles = StyleSheet.create({
  cover: { aspectRatio: 16 / 9, borderRadius: tokens.radius.large, width: '100%' },
});
