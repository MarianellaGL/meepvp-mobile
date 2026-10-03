import { MeepleImportProcessing, MeepleSourceOption } from '@decodadev02/meepleui';
import { router, useLocalSearchParams } from 'expo-router';

import { useGame } from '@/features/games/queries';
import { useImportRulebook } from '@/features/games/useImportRulebook';
import { Hint } from '@/shared/ui/Section';
import { Screen } from '@/shared/ui/Screen';

export default function GameSourcesScreen() {
  const { game, gameId, flow } = useLocalSearchParams<{ game?: string; gameId?: string; flow?: string }>();
  const params = { ...(game ? { game } : {}), ...(gameId ? { gameId } : {}), ...(flow === 'setup' ? { flow: 'setup' } : {}) };
  // The game's rulebook in the base is the recommended source when there is one.
  const rulebook = useGame(Number(gameId), game).data?.rulebooks[0];
  const importRulebook = useImportRulebook();

  return <Screen eyebrow={flow === 'setup' ? 'PARTIDA · PLANILLA' : 'CREAR PLANILLA'} title="¿De dónde salen los puntos?" subtitle={game ? `Elegí cómo armar la planilla de ${game}.` : 'Elegí cómo armar la planilla.'} onBack={() => router.back()}>
    {importRulebook.isPending ? <MeepleImportProcessing source="pdf" /> : <>
      {rulebook && <MeepleSourceOption source="rulebook" recommended detail={rulebook.name} onPress={() => importRulebook.mutate({ book: rulebook, context: { game, gameId, flow } })} />}
      {importRulebook.error && <Hint tone="error">{importRulebook.error.message}</Hint>}
      <MeepleSourceOption source="pdf" selected={!rulebook} onPress={() => router.push({ pathname: '/pdf/reader', params })} />
      <MeepleSourceOption source="photo" onPress={() => router.push({ pathname: '/images/reader', params })} />
      <MeepleSourceOption source="manual" onPress={() => router.push({ pathname: '/rules/new', params })} />
    </>}
  </Screen>;
}
