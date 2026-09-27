import { useCallback, useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ScoreBadge, ScoreSkeleton } from '@decodadev02/scoreui';
import { router, useFocusEffect } from 'expo-router';
import { Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTableScoreStore } from '@/stores/useTableScoreStore';
import { colors } from '@/theme';
import { AppButton as Button } from '@/components/AppButton';

export default function LibraryScreen() {
  const collection = useTableScoreStore((state) => state.collection);
  const rules = useTableScoreStore((state) => state.rules);
  const savedPDFs = useTableScoreStore((state) => state.savedPDFs);
  const hasRestored = useTableScoreStore((state) => state.hasRestored);
  const loadRules = useTableScoreStore((state) => state.loadRules);
  const [loadingRules, setLoadingRules] = useState(false);
  const [rulesError, setRulesError] = useState<string | null>(null);

  const refreshRules = useCallback(async () => {
    setLoadingRules(true);
    setRulesError(null);
    try { await loadRules(); }
    catch (cause) { setRulesError(cause instanceof Error ? cause.message : 'Could not load scoring sheets.'); }
    finally { setLoadingRules(false); }
  }, [loadRules]);

  useFocusEffect(useCallback(() => { refreshRules().catch(() => undefined); }, [refreshRules]));

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <FlatList
        data={collection}
        keyExtractor={(game) => String(game.bggId)}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <>
            <Text style={styles.eyebrow}>YOUR COLLECTION</Text>
            <Text style={styles.title}>Game library</Text>
            <Text style={styles.subtitle}>All your favorites, ready for the next game night.</Text>
            <Pressable accessibilityRole="button" accessibilityLabel="Create scoring sheet" onPress={() => router.push('/rules/new')} style={styles.banner}>
              <View style={styles.bannerIcon}><MaterialCommunityIcons name="table-edit" size={25} color={colors.forest} /></View>
              <View style={styles.bannerText}>
                <Text style={styles.bannerTitle}>Make a scoring sheet</Text>
                <Text style={styles.bannerCopy}>Turn any game into an easy score table.</Text>
              </View>
              <MaterialCommunityIcons name="arrow-right" size={22} color={colors.forest} />
            </Pressable>
            <Pressable accessibilityRole="button" accessibilityLabel="Find community victory point rules" onPress={() => router.push('/community/rules')} style={[styles.banner, styles.communityBanner]}>
              <View style={styles.bannerIcon}><MaterialCommunityIcons name="account-group-outline" size={25} color={colors.forest} /></View>
              <View style={styles.bannerText}>
                <Text style={styles.bannerTitle}>Community scoring rules</Text>
                <Text style={styles.bannerCopy}>Find sheets other players shared.</Text>
              </View>
              <MaterialCommunityIcons name="arrow-right" size={22} color={colors.forest} />
            </Pressable>
            <Pressable accessibilityRole="button" accessibilityLabel="Upload PDF rulebook" onPress={() => router.push('/pdf/reader')} style={[styles.banner, styles.pdfBanner]}>
              <View style={[styles.bannerIcon, styles.pdfBannerIcon]}><MaterialCommunityIcons name="file-pdf-box" size={25} color={colors.orangeInk} /></View>
              <View style={styles.bannerText}>
                <Text style={styles.bannerTitle}>Upload PDF rulebook</Text>
                <Text style={styles.bannerCopy}>Choose a file and find its scoring rules.</Text>
              </View>
              <MaterialCommunityIcons name="arrow-right" size={22} color={colors.orangeInk} />
            </Pressable>
            <Pressable accessibilityRole="button" accessibilityLabel="Read points table image" onPress={() => router.push('/images/reader')} style={[styles.banner, styles.communityBanner]}>
              <View style={styles.bannerIcon}><MaterialCommunityIcons name="image-search-outline" size={25} color={colors.forest} /></View>
              <View style={styles.bannerText}><Text style={styles.bannerTitle}>Read a points table image</Text><Text style={styles.bannerCopy}>Turn a photo or screenshot into a scoring-sheet draft.</Text></View>
              <MaterialCommunityIcons name="arrow-right" size={22} color={colors.forest} />
            </Pressable>
            <View style={styles.listHeading}>
              <Text variant="titleMedium" style={styles.listTitle}>Scoring sheets in the database</Text>
              <Text style={styles.count}>{rules.length} total</Text>
            </View>
            <Button mode="outlined" icon="refresh" loading={loadingRules} disabled={loadingRules} onPress={() => refreshRules().catch(() => undefined)}>Refresh sheets</Button>
            {rulesError && <Text style={styles.error}>{rulesError}</Text>}
            {rules.length ? rules.map((rule) => (
              <View key={rule.id} style={styles.sheetCard}>
                <Text style={styles.sheetGame}>{rule.gameName}</Text>
                <Text style={styles.sheetName}>{rule.name}</Text>
                <Text style={styles.gameMeta}>{rule.fields.length} scoring fields · {rule.isPublic ? 'Shared with community' : 'Not listed in community search'}</Text>
                <Button mode="text" icon="play" onPress={() => router.push({ pathname: '/sessions/new', params: { ruleId: rule.id } })}>Start game</Button>
              </View>
            )) : !loadingRules && <Text style={styles.emptyCopy}>No scoring sheets have been saved yet.</Text>}
            {savedPDFs.length > 0 && (
              <View style={styles.savedPDFSection}>
                <Text variant="titleMedium" style={styles.listTitle}>Saved rulebooks</Text>
                {savedPDFs.map((pdf) => (
                  <Button key={pdf.gameId ?? pdf.gameName} mode="outlined" icon="file-pdf-box" onPress={() => router.push({ pathname: '/pdf/reader', params: { game: pdf.gameName, ...(pdf.gameId ? { gameId: String(pdf.gameId) } : {}) } })}>{pdf.gameName} · {pdf.document.fileName}</Button>
                ))}
              </View>
            )}
            {collection.length > 0 && (
              <View style={styles.listHeading}>
                <Text variant="titleMedium" style={styles.listTitle}>Imported games</Text>
                <Text style={styles.count}>{collection.length} total</Text>
              </View>
            )}
          </>
        }
        ListEmptyComponent={!hasRestored ? <ScoreSkeleton variant="list" /> :
          <View style={styles.empty}>
            <View style={styles.emptyIcon}><MaterialCommunityIcons name="bookshelf" size={34} color={colors.forest} /></View>
            <Text variant="headlineSmall" style={styles.emptyTitle}>Your shelf is waiting</Text>
            <Text style={styles.emptyCopy}>Import your BoardGameGeek collection to see your games here.</Text>
            <Button mode="contained" icon="download" onPress={() => router.navigate('/')}>Go to import</Button>
          </View>
        }
        renderItem={({ item, index }) => (
          <Pressable accessibilityRole="button" accessibilityLabel={`View rules discussions for ${item.name}`} onPress={() => router.push({ pathname: '/games/[gameId]', params: { gameId: String(item.bggId), name: item.name } })} style={styles.gameCard}>
            <View style={[styles.gameArt, { backgroundColor: index % 2 === 0 ? colors.mint : colors.orangePale }]}>
              <MaterialCommunityIcons name="dice-multiple-outline" size={28} color={index % 2 === 0 ? colors.forest : colors.orangeInk} />
            </View>
            <View style={styles.gameBody}>
              <Text variant="titleMedium" style={styles.gameName} numberOfLines={2}>{item.name}</Text>
              <Text style={styles.gameMeta}>{item.yearPublished || 'Year unknown'} · {item.minPlayers ?? '?'}–{item.maxPlayers ?? '?'} players</Text>
              {!!item.playingTime && <Text style={styles.gameMeta}>{item.playingTime} min</Text>}
              <ScoreBadge tone={rules.some((rule) => rule.bggId === item.bggId || (!rule.bggId && rule.gameName.trim().toLocaleLowerCase() === item.name.trim().toLocaleLowerCase())) ? 'success' : 'warning'} label={rules.some((rule) => rule.bggId === item.bggId || (!rule.bggId && rule.gameName.trim().toLocaleLowerCase() === item.name.trim().toLocaleLowerCase())) ? 'Scoring sheet ready' : 'No scoring sheet yet'} />
            </View>
            <MaterialCommunityIcons name="chevron-right" size={22} color={colors.muted} />
          </Pressable>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.canvas },
  content: { gap: 12, padding: 20, paddingBottom: 36 },
  eyebrow: { color: colors.orangeInk, fontSize: 10, fontWeight: '800', letterSpacing: 1.5, marginTop: 10 },
  title: { color: colors.ink, fontSize: 34, fontWeight: '800', letterSpacing: -1.2 },
  subtitle: { color: colors.muted, fontSize: 15, lineHeight: 21, marginBottom: 16 },
  banner: { alignItems: 'center', backgroundColor: colors.mint, borderRadius: 20, flexDirection: 'row', gap: 12, padding: 15 },
  communityBanner: { backgroundColor: colors.paper, borderColor: colors.line, borderWidth: 1 },
  pdfBanner: { backgroundColor: colors.orangePale },
  pdfBannerIcon: { backgroundColor: colors.paper },
  bannerIcon: { alignItems: 'center', backgroundColor: colors.paper, borderRadius: 13, height: 44, justifyContent: 'center', width: 44 },
  bannerText: { flex: 1 },
  bannerTitle: { color: colors.ink, fontSize: 14, fontWeight: '800' },
  bannerCopy: { color: colors.muted, fontSize: 12, lineHeight: 17, marginTop: 2 },
  listHeading: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2, marginTop: 20 },
  listTitle: { color: colors.ink, fontWeight: '800' },
  savedPDFSection: { gap: 9, marginTop: 12 },
  count: { color: colors.muted, fontSize: 12, fontWeight: '700' },
  gameCard: { alignItems: 'center', backgroundColor: colors.paper, borderColor: colors.line, borderRadius: 18, borderWidth: 1, flexDirection: 'row', gap: 13, padding: 12 },
  gameArt: { alignItems: 'center', borderRadius: 13, height: 62, justifyContent: 'center', width: 62 },
  gameBody: { flex: 1 },
  gameName: { color: colors.ink, fontWeight: '700' },
  gameMeta: { color: colors.muted, fontSize: 12, marginTop: 3 },
  sheetStatus: { fontSize: 11, fontWeight: '800', marginTop: 6 },
  empty: { alignItems: 'center', backgroundColor: colors.paper, borderColor: colors.line, borderRadius: 24, borderWidth: 1, gap: 14, marginTop: 15, padding: 28 },
  emptyIcon: { alignItems: 'center', backgroundColor: colors.mint, borderRadius: 23, height: 78, justifyContent: 'center', marginBottom: 2, width: 78 },
  emptyTitle: { color: colors.ink, fontWeight: '800', textAlign: 'center' },
  emptyCopy: { color: colors.muted, lineHeight: 20, textAlign: 'center' },
  loader: { marginTop: 35 },
  sheetCard: { backgroundColor: colors.paper, borderColor: colors.line, borderRadius: 18, borderWidth: 1, gap: 5, padding: 15 },
  sheetGame: { color: colors.orangeInk, fontSize: 11, fontWeight: '800', letterSpacing: 0.8 },
  sheetName: { color: colors.ink, fontSize: 17, fontWeight: '800' },
  error: { color: colors.error },
});
