import { useCallback, useEffect, useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, Button, IconButton, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

import { api, type GameRules } from '@/lib/api';
import { useTableScoreStore } from '@/stores/useTableScoreStore';
import { colors } from '@/theme';

export default function GameRulesScreen() {
  const { gameId, name } = useLocalSearchParams<{ gameId: string; name?: string }>();
  const id = Number(gameId);
  const [rules, setRules] = useState<GameRules | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const scoringRules = useTableScoreStore((state) => state.rules);
  const savedPDF = useTableScoreStore((state) => state.savedPDFs.find((pdf) => pdf.gameId === id));
  const gameSheets = scoringRules.filter((rule) => rule.bggId === id || (!rule.bggId && rule.gameName.trim().toLocaleLowerCase() === String(name ?? '').trim().toLocaleLowerCase()));

  const loadRules = useCallback(async () => {
    if (!Number.isSafeInteger(id) || id <= 0) {
      setError('Invalid game ID.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try { setRules(await api.getGameRules(id)); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not load BGG rules discussions.'); }
    finally { setLoading(false); }
  }, [id]);

  useEffect(() => {
    let active = true;
    const request = Number.isSafeInteger(id) && id > 0 ? api.getGameRules(id) : Promise.reject(new Error('Invalid game ID.'));
    request
      .then((result) => { if (active) setRules(result); })
      .catch((cause) => { if (active) setError(cause instanceof Error ? cause.message : 'Could not load BGG rules discussions.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id]);

  async function openURL(url: string) {
    try { await Linking.openURL(url); }
    catch { setError('Could not open BoardGameGeek on this device.'); }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.topRow}><IconButton icon="arrow-left" iconColor={colors.forest} onPress={() => router.back()} /><Text style={styles.topLabel}>GAME RULES</Text><View style={styles.topSpacer} /></View>
        <Text style={styles.title}>{name || 'Game rules'}</Text>
        <Text style={styles.subtitle}>Explore rule questions and answers from the BoardGameGeek community.</Text>

        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>{gameSheets.length ? `${gameSheets.length} scoring sheet${gameSheets.length === 1 ? '' : 's'} saved` : 'No scoring sheet for this game yet'}</Text>
          {gameSheets.map((sheet) => <Text key={sheet.id} style={styles.emptyCopy}>{sheet.name} · {sheet.fields.length} fields</Text>)}
          {gameSheets.length > 0 && <Button mode="contained" icon="play" onPress={() => router.push({ pathname: '/sessions/new', params: { ruleId: gameSheets[0].id } })}>Start scoring</Button>}
          <Button mode="contained" icon="table-edit" onPress={() => router.push({ pathname: '/rules/new', params: { gameId: String(id), game: String(name ?? '') } })}>Create scoring sheet</Button>
          <Button mode="outlined" icon="file-pdf-box" onPress={() => router.push({ pathname: '/pdf/reader', params: { gameId: String(id), game: String(name ?? '') } })}>Upload PDF rulebook</Button>
          <Button mode="outlined" icon="account-group-outline" onPress={() => router.push({ pathname: '/community/rules', params: { gameId: String(id), game: String(name ?? '') } })}>Find community scoring rules</Button>
          {savedPDF && <Text style={styles.emptyCopy}>Saved rulebook: {savedPDF.document.fileName}</Text>}
        </View>

        <View style={styles.summaryCard}>
          <View style={styles.summaryIcon}><MaterialCommunityIcons name="forum-outline" size={27} color={colors.paper} /></View>
          <Text style={styles.summaryCount}>{rules?.status === 'ready' ? rules.totalThreads : '—'}</Text>
          <Text style={styles.summaryLabel}>RULES DISCUSSIONS</Text>
          <Text style={styles.summaryCopy}>Community conversations can clarify tricky situations. Check the rulebook for official rules.</Text>
        </View>

        <Button mode="outlined" icon="file-document-outline" onPress={() => openURL(`https://boardgamegeek.com/boardgame/${id}/files`)}>See rulebooks and files on BGG</Button>

        <View style={styles.sectionHeader}><Text style={styles.eyebrow}>RULES FORUM</Text><Text variant="headlineSmall" style={styles.heading}>Discussions</Text></View>
        {loading ? <ActivityIndicator size="large" style={styles.loader} /> : rules?.status === 'processing' ? (
          <View style={styles.emptyCard}><Text style={styles.emptyTitle}>BGG is preparing this forum</Text><Text style={styles.emptyCopy}>Try again in {rules.retryAfterSeconds ?? 5} seconds.</Text><Button mode="contained" onPress={loadRules}>Try again</Button></View>
        ) : error ? (
          <View style={styles.emptyCard}><Text style={styles.error}>{error}</Text><Button mode="contained" onPress={loadRules}>Try again</Button></View>
        ) : rules?.threads.length ? (
          <>
            {rules.threads.slice(0, 20).map((thread) => (
              <Pressable key={thread.id} accessibilityRole="link" onPress={() => openURL(thread.url)} style={styles.threadCard}>
                <View style={styles.threadIcon}><MaterialCommunityIcons name="comment-question-outline" size={22} color={colors.forest} /></View>
                <View style={styles.threadBody}><Text style={styles.threadTitle}>{thread.title}</Text><Text style={styles.threadMeta}>by {thread.author} · {thread.posts} posts</Text></View>
                <MaterialCommunityIcons name="open-in-new" size={18} color={colors.muted} />
              </Pressable>
            ))}
            {!!rules.forumUrl && <Button mode="text" icon="open-in-new" onPress={() => openURL(rules.forumUrl!)}>Browse all {rules.totalThreads} discussions on BGG</Button>}
          </>
        ) : (
          <View style={styles.emptyCard}><Text style={styles.emptyTitle}>No rules discussions yet</Text><Text style={styles.emptyCopy}>You can still check the game&apos;s files for a rulebook.</Text></View>
        )}
        <Text style={styles.attribution}>Forum titles and links from BoardGameGeek.</Text>
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
  subtitle: { color: colors.muted, fontSize: 15, lineHeight: 21, marginBottom: 7 },
  summaryCard: { alignItems: 'flex-start', backgroundColor: colors.forest, borderRadius: 24, padding: 20 },
  summaryIcon: { alignItems: 'center', backgroundColor: '#3B6A60', borderRadius: 15, height: 48, justifyContent: 'center', marginBottom: 12, width: 48 },
  summaryCount: { color: colors.paper, fontSize: 42, fontWeight: '800', lineHeight: 48 },
  summaryLabel: { color: colors.orangePale, fontSize: 10, fontWeight: '800', letterSpacing: 1.5 },
  summaryCopy: { color: '#D5E7DE', fontSize: 13, lineHeight: 19, marginTop: 12 },
  sectionHeader: { marginTop: 15 },
  eyebrow: { color: colors.orangeInk, fontSize: 10, fontWeight: '800', letterSpacing: 1.5 },
  heading: { color: colors.ink, fontWeight: '800', marginTop: 3 },
  loader: { marginTop: 24 },
  emptyCard: { alignItems: 'center', backgroundColor: colors.paper, borderColor: colors.line, borderRadius: 20, borderWidth: 1, gap: 10, marginTop: 6, padding: 22 },
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
