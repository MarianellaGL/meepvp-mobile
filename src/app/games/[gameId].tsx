import { useCallback, useEffect, useState } from 'react';
import { Image, Linking, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, IconButton, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

import { api, type GameRules } from '@/lib/api';
import { useTableScoreStore } from '@/stores/useTableScoreStore';
import { colors } from '@/theme';
import { AppButton as Button } from '@/components/AppButton';

export default function GameRulesScreen() {
  const { gameId, name, imageUrl } = useLocalSearchParams<{ gameId: string; name?: string; imageUrl?: string }>();
  const id = Number(gameId);
  const [rules, setRules] = useState<GameRules | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const scoringRules = useTableScoreStore((state) => state.rules);
  const game = useTableScoreStore((state) => state.collection.find((item) => item.bggId === id));
  const savedPDF = useTableScoreStore((state) => state.savedPDFs.find((pdf) => pdf.gameId === id));
  const gameSheets = scoringRules.filter((rule) => rule.bggId === id || (!rule.bggId && rule.gameName.trim().toLocaleLowerCase() === String(name ?? '').trim().toLocaleLowerCase()));

  const loadRules = useCallback(async () => {
    if (!Number.isSafeInteger(id) || id <= 0) {
      setError('El ID del juego no es válido.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try { setRules(await api.getGameRules(id)); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'No pudimos cargar las conversaciones de BGG.'); }
    finally { setLoading(false); }
  }, [id]);

  useEffect(() => {
    let active = true;
    const request = Number.isSafeInteger(id) && id > 0 ? api.getGameRules(id) : Promise.reject(new Error('El ID del juego no es válido.'));
    request
      .then((result) => { if (active) setRules(result); })
      .catch((cause) => { if (active) setError(cause instanceof Error ? cause.message : 'No pudimos cargar las conversaciones de BGG.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id]);

  async function openURL(url: string) {
    try { await Linking.openURL(url); }
    catch { setError('No pudimos abrir BoardGameGeek en este dispositivo.'); }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.topRow}><IconButton icon="arrow-left" iconColor={colors.forest} onPress={() => router.back()} /><Text style={styles.topLabel}>REGLAS DEL JUEGO</Text><View style={styles.topSpacer} /></View>
        <Text style={styles.title}>{name || 'Reglas del juego'}</Text>
        {(game?.imageUrl || game?.thumbnailUrl || imageUrl) && <Image source={{ uri: game?.imageUrl || game?.thumbnailUrl || imageUrl }} style={styles.cover} resizeMode="contain" accessibilityLabel={`Carátula de ${name ?? game?.name ?? 'juego'}`} />}
        <Text style={styles.subtitle}>Elegí una planilla para jugar o prepará una desde el reglamento.</Text>

        <View style={styles.sectionHeader}><Text style={styles.eyebrow}>PARA JUGAR</Text><Text variant="headlineSmall" style={styles.heading}>Planillas</Text></View>
        {gameSheets.length ? gameSheets.map((sheet) => (
          <View key={sheet.id} style={styles.actionCard}>
            <Text style={styles.actionTitle}>{sheet.name}</Text>
            <Text style={styles.actionCopy}>{sheet.fields.length} campos de puntuación</Text>
            <Button mode="contained" icon="play" onPress={() => router.push({ pathname: '/sessions/new', params: { ruleId: sheet.id } })}>Empezar partida</Button>
          </View>
        )) : <View style={styles.actionCard}><Text style={styles.actionTitle}>Todavía no hay una planilla</Text><Text style={styles.actionCopy}>Podés buscar una de la comunidad o crear la tuya con un reglamento.</Text></View>}
        <Button mode="outlined" icon="account-group-outline" onPress={() => router.push({ pathname: '/community/rules', params: { gameId: String(id), game: String(name ?? '') } })}>Buscar planillas de la comunidad</Button>

        <View style={styles.sectionHeader}><Text style={styles.eyebrow}>PARA CREAR UNA PLANILLA</Text><Text variant="headlineSmall" style={styles.heading}>Elegí una fuente</Text></View>
        <View style={styles.actionCard}>
          <Text style={styles.actionTitle}>Reglamento</Text>
          <Text style={styles.actionCopy}>Buscá una edición en el catálogo o subí tu propio PDF. Vas a revisar los campos antes de guardar.</Text>
          <Button mode="contained" icon="book-search-outline" onPress={() => router.push({ pathname: '/rulebooks', params: { gameId: String(id), game: String(name ?? '') } })}>Buscar reglamento</Button>
          <Button mode="outlined" icon="file-pdf-box" onPress={() => router.push({ pathname: '/pdf/reader', params: { gameId: String(id), game: String(name ?? '') } })}>Subir mi PDF</Button>
          {savedPDF && <Button mode="outlined" icon="text-box-check-outline" onPress={() => router.push({ pathname: '/pdf/reader', params: { gameId: String(id), game: String(name ?? '') } })}>Retomar texto guardado</Button>}
          {savedPDF && <Text style={styles.actionCopy}>Texto guardado: {savedPDF.document.fileName}</Text>}
        </View>
        <View style={styles.actionCard}>
          <Text style={styles.actionTitle}>Otras formas de empezar</Text>
          <Text style={styles.actionCopy}>Leé una foto de la tabla de puntos o cargá los campos manualmente.</Text>
          <Button mode="outlined" icon="image-search-outline" onPress={() => router.push({ pathname: '/images/reader', params: { gameId: String(id), game: String(name ?? '') } })}>Leer tabla de puntos</Button>
          <Button mode="outlined" icon="table-edit" onPress={() => router.push({ pathname: '/rules/new', params: { gameId: String(id), game: String(name ?? '') } })}>Crear planilla manual</Button>
        </View>

        <View style={styles.summaryCard}>
          <View style={styles.summaryIcon}><MaterialCommunityIcons name="forum-outline" size={27} color={colors.forest} /></View>
          <Text style={styles.summaryCount}>{rules?.status === 'ready' ? rules.totalThreads : '—'}</Text>
          <Text style={styles.summaryLabel}>CONVERSACIONES SOBRE REGLAS</Text>
          <Text style={styles.summaryCopy}>La comunidad puede aclarar dudas. Consultá el reglamento para confirmar las reglas oficiales.</Text>
        </View>

        <Button mode="outlined" icon="open-in-new" onPress={() => openURL(`https://boardgamegeek.com/boardgame/${id}/files`)}>Ver archivos de BGG</Button>

        <View style={styles.sectionHeader}><Text style={styles.eyebrow}>FORO DE REGLAS</Text><Text variant="headlineSmall" style={styles.heading}>Conversaciones</Text></View>
        {loading ? <ActivityIndicator size="large" style={styles.loader} /> : rules?.status === 'processing' ? (
          <View style={styles.emptyCard}><Text style={styles.emptyTitle}>BGG está preparando este foro</Text><Text style={styles.emptyCopy}>Reintentá en {rules.retryAfterSeconds ?? 5} segundos.</Text><Button mode="contained" onPress={loadRules}>Reintentar</Button></View>
        ) : error ? (
          <View style={styles.emptyCard}><Text style={styles.error}>{error}</Text><Button mode="contained" onPress={loadRules}>Reintentar</Button></View>
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
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.canvas },
  content: { gap: 13, padding: 20, paddingBottom: 42 },
  topRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginLeft: -12 },
  topLabel: { color: colors.orangeInk, fontSize: 10, fontWeight: '800', letterSpacing: 1.4 },
  topSpacer: { width: 40 },
  title: { color: colors.ink, fontSize: 32, fontWeight: '800', letterSpacing: -1.1, marginTop: 6 },
  cover: { alignSelf: 'center', width: 180, height: 220, borderRadius: 12, marginVertical: 8 },
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
});
