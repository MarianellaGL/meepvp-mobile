import { useState } from 'react';
import { Image, Linking, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { MeepleDisclosure, MeepleLibraryEntry } from '@decodadev02/meepleui';
import { router, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, IconButton, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useGameRules } from '@/hooks/useGameRules';
import { AppBottomNav, type AppTab } from '@/components/AppBottomNav';
import { useTableScoreStore } from '@/stores/useTableScoreStore';
import { colors, tokens } from '@/theme';
import { AppButton as Button } from '@/components/AppButton';

export default function GameRulesScreen() {
  const { gameId, name, imageUrl, flow } = useLocalSearchParams<{ gameId: string; name?: string; imageUrl?: string; flow?: string }>();
  const id = Number(gameId);
  const rulesQuery = useGameRules(id);
  const rules = rulesQuery.data;
  const [linkError, setLinkError] = useState<string | null>(null);
  const [showForum, setShowForum] = useState(false);
  const scoringRules = useTableScoreStore((state) => state.rules);
  const game = useTableScoreStore((state) => state.collection.find((item) => item.bggId === id));
  const savedPDF = useTableScoreStore((state) => state.savedPDFs.find((pdf) => pdf.gameId === id));
  const gameSheets = scoringRules.filter((rule) => rule.bggId === id || (!rule.bggId && rule.gameName.trim().toLocaleLowerCase() === String(name ?? '').trim().toLocaleLowerCase()));
  const gameName = String(name ?? game?.name ?? 'este juego');
  const gameParams = { gameId: String(id), game: gameName, ...(flow === 'setup' ? { flow: 'setup' } : {}) };

  function selectTab(tab: AppTab) {
    if (tab === 'home') router.navigate('/');
    else if (tab === 'library') router.navigate('/library');
    else if (tab === 'profile') router.navigate('/profile');
    else if (tab === 'new-game') router.push('/sessions/new');
    else router.navigate('/tables');
  }

  function primaryAction() {
    if (gameSheets.length) router.push({ pathname: '/sessions/new', params: { ruleId: gameSheets[0].id } });
    else router.push({ pathname: '/games/sources', params: gameParams });
  }

  async function openURL(url: string) {
    try { await Linking.openURL(url); }
    catch { setLinkError('No pudimos abrir BoardGameGeek en este dispositivo.'); }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.topRow}><IconButton icon="arrow-left" iconColor={colors.forest} onPress={() => router.back()} /><Text style={styles.topLabel}>{flow === 'setup' ? 'PARTIDA · PLANILLA' : 'TU BIBLIOTECA'}</Text><View style={styles.topSpacer} /></View>
        <Text style={styles.title}>{gameName}</Text>
        <Text style={styles.subtitle}>{game?.yearPublished ? `${game.yearPublished} · ` : ''}{game?.minPlayers && game?.maxPlayers ? `${game.minPlayers}–${game.maxPlayers} jugadores` : 'Juego de mesa'}</Text>
        {(game?.imageUrl || game?.thumbnailUrl || imageUrl) && <Image source={{ uri: game?.imageUrl || game?.thumbnailUrl || imageUrl }} style={styles.cover} resizeMode="cover" accessibilityLabel={`Carátula de ${gameName}`} />}
        <Text style={styles.eyebrow}>FUENTES PARA ESTE JUEGO</Text>
        {gameSheets.length ? gameSheets.map((sheet) => <MeepleLibraryEntry key={sheet.id} title={sheet.name} detail={`${sheet.fields.length} campos · Lista para jugar`} onPress={() => router.push({ pathname: '/sessions/new', params: { ruleId: sheet.id } })} />) :
          <Text style={styles.actionCopy}>Todavía no hay una planilla lista para jugar.</Text>}
        <MeepleLibraryEntry title="Planilla de la comunidad" detail="Revisá una copia antes de usarla" onPress={() => router.push({ pathname: '/community/rules', params: gameParams })} />
        <MeepleLibraryEntry title="Reglamento" detail="Consultá las reglas y prepará los puntos" onPress={() => router.push({ pathname: '/rulebooks', params: gameParams })} />
        {savedPDF && <MeepleLibraryEntry title="PDF guardado" detail={savedPDF.document.fileName} onPress={() => router.push({ pathname: '/pdf/reader', params: gameParams })} />}
        {!gameSheets.length && <MeepleLibraryEntry title="Usar otra fuente" detail="PDF, foto o planilla manual" onPress={() => router.push({ pathname: '/games/sources', params: gameParams })} />}

        <MeepleDisclosure title="Dudas sobre las reglas" detail={rules?.status === 'ready' ? `${rules.totalThreads} conversaciones en BGG` : 'Foro de BoardGameGeek'} expanded={showForum} onPress={() => setShowForum((shown) => !shown)} />
        {showForum && <>
        <Text style={styles.actionCopy}>La comunidad puede aclarar dudas. Confirmá las reglas oficiales en el reglamento.</Text>
        <Button mode="outlined" icon="open-in-new" onPress={() => openURL(`https://boardgamegeek.com/boardgame/${id}/files`)}>Ver archivos de BGG</Button>
        {linkError && <Text style={styles.error}>{linkError}</Text>}
        {!Number.isSafeInteger(id) || id <= 0 ? <Text style={styles.error}>El ID del juego no es válido.</Text> : rulesQuery.isPending || rulesQuery.isFetching ? <ActivityIndicator size="large" style={styles.loader} /> : rules?.status === 'processing' ? (
          <View style={styles.emptyCard}><Text style={styles.emptyTitle}>BGG está preparando este foro</Text><Text style={styles.emptyCopy}>Reintentá en {rules.retryAfterSeconds ?? 5} segundos.</Text><Button mode="contained" onPress={() => void rulesQuery.refetch()}>Reintentar</Button></View>
        ) : rulesQuery.error ? (
          <View style={styles.emptyCard}><Text style={styles.error}>{rulesQuery.error.message}</Text><Button mode="contained" onPress={() => void rulesQuery.refetch()}>Reintentar</Button></View>
        ) : rules?.threads.length ? (
          <>
            {rules.threads.slice(0, 20).map((thread) => (
              <Pressable key={thread.id} accessibilityRole="link" onPress={() => openURL(thread.url)} style={styles.threadCard}>
                <View style={styles.threadIcon}><MaterialCommunityIcons name="comment-question-outline" size={22} color={colors.forest} /></View>
                <View style={styles.threadBody}><Text style={styles.threadTitle}>{thread.title}</Text><Text style={styles.threadMeta}>por {thread.author} · {thread.posts} publicaciones</Text></View>
                <MaterialCommunityIcons name="open-in-new" size={18} color={colors.muted} />
              </Pressable>
            ))}
            {!!rules.forumUrl && <Button mode="text" icon="open-in-new" onPress={() => openURL(rules.forumUrl!)}>Ver las {rules.totalThreads} conversaciones en BGG</Button>}
          </>
        ) : (
          <View style={styles.emptyCard}><Text style={styles.emptyTitle}>Todavía no hay conversaciones</Text><Text style={styles.emptyCopy}>Podés consultar los archivos del juego para encontrar un reglamento.</Text></View>
        )}
        <Text style={styles.attribution}>Títulos y enlaces del foro de BoardGameGeek.</Text>
        </>}
      </ScrollView>
      <View style={styles.bottomAction}><Button mode="contained" onPress={primaryAction}>{gameSheets.length ? 'Empezar partida' : 'Preparar planilla'}</Button></View>
      {flow !== 'setup' && <AppBottomNav active="library" onSelect={selectTab} />}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.canvas },
  content: { gap: 13, padding: 24, paddingBottom: 42 },
  topRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginLeft: -12 },
  topLabel: { color: colors.orangeInk, fontSize: 10, fontWeight: '800', letterSpacing: 1.4 },
  topSpacer: { width: 40 },
  title: { color: colors.ink, fontFamily: tokens.font.heading, fontSize: 27, lineHeight: 35, marginTop: 6 },
  cover: { alignSelf: 'center', width: 124, height: 124, borderRadius: 12, marginVertical: 8 },
  subtitle: { color: colors.muted, fontSize: 15, lineHeight: 21, marginBottom: 7 },
  summaryCard: { alignItems: 'flex-start', backgroundColor: colors.paper, borderColor: colors.forest, borderRadius: 24, borderWidth: 1, padding: 20 },
  summaryIcon: { alignItems: 'center', backgroundColor: colors.mint, borderRadius: 15, height: 48, justifyContent: 'center', marginBottom: 12, width: 48 },
  summaryCount: { color: colors.ink, fontSize: 42, fontWeight: '800', lineHeight: 48 },
  summaryLabel: { color: colors.forest, fontSize: 10, fontWeight: '800', letterSpacing: 1.5 },
  summaryCopy: { color: colors.muted, fontSize: 13, lineHeight: 19, marginTop: 12 },
  sectionHeader: { marginTop: 15 },
  eyebrow: { color: colors.orangeInk, fontSize: 10, fontWeight: '800', letterSpacing: 1.5 },
  heading: { color: colors.ink, fontWeight: '800', marginTop: 3 },
  loader: { marginTop: 24 },
  emptyCard: { alignItems: 'center', backgroundColor: colors.paper, borderColor: colors.line, borderRadius: 20, borderWidth: 1, gap: 10, marginTop: 6, padding: 22 },
  actionCard: { backgroundColor: colors.paper, borderColor: colors.line, borderRadius: 20, borderWidth: 1, gap: 10, padding: 18 },
  actionTitle: { color: colors.ink, fontSize: 16, fontWeight: '800' },
  actionCopy: { color: colors.muted, fontSize: 13, lineHeight: 19 },
  emptyTitle: { color: colors.ink, fontSize: 16, fontWeight: '800', textAlign: 'center' },
  emptyCopy: { color: colors.muted, lineHeight: 20, textAlign: 'center' },
  threadCard: { alignItems: 'center', backgroundColor: colors.paper, borderColor: colors.line, borderRadius: 17, borderWidth: 1, flexDirection: 'row', gap: 11, padding: 13 },
  threadIcon: { alignItems: 'center', backgroundColor: colors.mint, borderRadius: 12, height: 42, justifyContent: 'center', width: 42 },
  threadBody: { flex: 1 },
  threadTitle: { color: colors.ink, fontSize: 14, fontWeight: '700', lineHeight: 20 },
  threadMeta: { color: colors.muted, fontSize: 11, marginTop: 4 },
  attribution: { color: colors.muted, fontSize: 11, marginTop: 9, textAlign: 'center' },
  error: { color: colors.error, textAlign: 'center' },
  bottomAction: { backgroundColor: colors.canvas, paddingHorizontal: 24, paddingVertical: 12 },
});
