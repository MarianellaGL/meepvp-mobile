import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ScoreTextField as TextInput } from '@decodadev02/scoreui';
import { ActivityIndicator, HelperText, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTableScoreStore } from '@/stores/useTableScoreStore';
import { colors } from '@/theme';
import { AppButton as Button } from '@/components/AppButton';

export default function DashboardScreen() {
  const [usernameDraft, setUsernameDraft] = useState<string | null>(null);
  const [tableName, setTableName] = useState('');
  const store = useTableScoreStore();
  const username = usernameDraft ?? store.username;

  async function createTable() {
    try { await store.createTable(tableName); } catch { /* The store displays the error. */ }
  }

  async function importCollection() {
    if (!username.trim()) return;
    try { await store.loadCollection(username); } catch { /* The store displays the error. */ }
  }

  function openGame() {
    if (store.session) router.push(`/sessions/${store.session.id}`);
    else if (store.table) router.push('/sessions/new');
    else createTable();
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.brand}>
          <View style={styles.brandMark}><MaterialCommunityIcons name="dice-multiple" color={colors.canvas} size={22} /></View>
          <View>
            <Text style={styles.brandName}>MeepVP</Text>
            <Text style={styles.brandTag}>YOUR TABLE, YOUR RULES</Text>
          </View>
        </View>

        <LinearGradient colors={[colors.forestDark, colors.paper, colors.orangePale]} style={styles.hero}>
          <View style={styles.heroCircle} />
          <View style={styles.heroCircleSmall} />
          <View style={styles.heroBadge}>
            <MaterialCommunityIcons name="cards-outline" color={colors.forest} size={16} />
            <Text style={styles.heroBadgeText}>READY FOR GAME NIGHT</Text>
          </View>
          <Text style={styles.heroTitle}>Play more.\nCount less.</Text>
          <Text style={styles.heroCopy}>A little less math, a lot more game.</Text>
          <Button
            mode="contained"
            icon={store.session ? 'arrow-right' : 'plus'}
            loading={store.isCreatingTable}
            disabled={!store.hasRestored || store.isRestoring}
            onPress={openGame}
            style={styles.heroButton}
          >
            {store.session ? 'Return to game' : store.table ? 'Start a game' : 'Create a table'}
          </Button>
        </LinearGradient>

        <View style={styles.sectionTitle}>
          <View>
            <Text style={styles.eyebrow}>THE TABLE</Text>
            <Text variant="headlineSmall" style={styles.heading}>Tonight&apos;s game</Text>
          </View>
          <View style={styles.statusPill}>
            <View style={[styles.statusDot, { backgroundColor: store.table ? colors.forest : colors.orange }]} />
            <Text style={styles.statusText}>{store.table ? 'Ready' : 'New'}</Text>
          </View>
        </View>

        <View style={styles.tableCard}>
          {!store.hasRestored || store.isRestoring ? (
            <ActivityIndicator />
          ) : store.table ? (
            <>
              <View style={styles.tableCardTop}>
                <View style={styles.tableIcon}><MaterialCommunityIcons name="table-furniture" color={colors.forest} size={24} /></View>
                <View style={styles.tableDetails}>
                  <Text variant="titleLarge" style={styles.cardTitle}>{store.table.name || 'Game night'}</Text>
                  <Text style={styles.muted}>{store.session ? 'Your game is in progress' : 'Waiting for players'}</Text>
                </View>
              </View>
              <View style={styles.codeStrip}>
                <Text style={styles.codeLabel}>TABLE CODE</Text>
                <Text style={styles.codeValue}>{store.table.code}</Text>
              </View>
              <Button mode="contained" icon="arrow-right" onPress={openGame}>
                {store.session ? 'Open game' : 'Start scoring'}
              </Button>
            </>
          ) : (
            <>
              <View style={styles.tableCardTop}>
                <View style={styles.tableIcon}><MaterialCommunityIcons name="account-group-outline" color={colors.forest} size={25} /></View>
                <View style={styles.tableDetails}>
                  <Text variant="titleLarge" style={styles.cardTitle}>Make room for everyone</Text>
                  <Text style={styles.muted}>No sign-up needed. Create a table and share its code.</Text>
                </View>
              </View>
              <TextInput label="Table name" placeholder="Friday game night" value={tableName} onChangeText={setTableName} mode="outlined" />
              <Button mode="contained" icon="plus" loading={store.isCreatingTable} onPress={createTable}>Create table</Button>
            </>
          )}
        </View>

        <View style={styles.sectionTitle}>
          <View>
            <Text style={styles.eyebrow}>MAKE IT YOURS</Text>
            <Text variant="headlineSmall" style={styles.heading}>Quick actions</Text>
          </View>
        </View>
        <View style={styles.actions}>
          <View style={[styles.actionCard, styles.actionWarm]}>
            <View style={[styles.actionIcon, { backgroundColor: colors.orangePale }]}>
              <MaterialCommunityIcons name="table-edit" color={colors.orangeInk} size={25} />
            </View>
            <Text variant="titleMedium" style={styles.actionTitle}>Scoring sheet</Text>
            <Text style={styles.muted}>Build rules that fit your game.</Text>
            <Button mode="text" icon="arrow-right" onPress={() => router.push('/rules/new')}>Create</Button>
          </View>
          <View style={[styles.actionCard, styles.actionCool]}>
            <View style={[styles.actionIcon, { backgroundColor: colors.mint }]}>
              <MaterialCommunityIcons name="bookshelf" color={colors.forest} size={25} />
            </View>
            <Text variant="titleMedium" style={styles.actionTitle}>Your library</Text>
            <Text style={styles.muted}>Keep favorite games close.</Text>
            <Button mode="text" icon="arrow-right" onPress={() => router.push('/library')}>Explore</Button>
          </View>
        </View>

        <Button mode="contained-tonal" icon="file-pdf-box" style={styles.pdfAction} onPress={() => router.push('/pdf/reader')}>Upload PDF rulebook</Button>
        <Button mode="outlined" icon="account-group-outline" style={styles.communityAction} onPress={() => router.push('/community/rules')}>Find community scoring rules</Button>
        <Button mode="outlined" icon="calendar-plus" style={styles.communityAction} onPress={() => router.push('/schedule')}>Schedule a game</Button>

        <View style={styles.sectionTitle}>
          <View>
            <Text style={styles.eyebrow}>YOUR COLLECTION</Text>
            <Text variant="headlineSmall" style={styles.heading}>Bring your games</Text>
          </View>
          <Text style={styles.count}>{store.collection.length} games</Text>
        </View>
        <View style={styles.importCard}>
          <View style={styles.importHeader}>
            <MaterialCommunityIcons name="database-import-outline" color={colors.forest} size={23} />
            <Text variant="titleMedium" style={styles.cardTitle}>Connect BoardGameGeek</Text>
          </View>
          <Text style={styles.muted}>Enter your BGG username to see your collection here.</Text>
          <TextInput label="BGG username" value={username} onChangeText={setUsernameDraft} autoCapitalize="none" mode="outlined" />
          <Button mode="outlined" icon="download" loading={store.isLoadingCollection} disabled={!store.hasRestored || !username.trim()} onPress={importCollection}>Import collection</Button>
        </View>
        {store.error && <HelperText type="error" visible>{store.error}</HelperText>}
        {store.collectionStatus && <HelperText type="info" visible>{store.collectionStatus}</HelperText>}
        {store.collection.slice(0, 3).map((game) => (
          <View key={game.bggId} style={styles.gameRow}>
            <View style={styles.gameMark}><MaterialCommunityIcons name="dice-5-outline" color={colors.forest} size={22} /></View>
            <View style={styles.gameDetails}>
              <Text variant="titleSmall">{game.name}</Text>
              <Text style={styles.muted}>{game.yearPublished || 'Year unknown'} · {game.minPlayers ?? '?'}–{game.maxPlayers ?? '?'} players</Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.canvas },
  content: { paddingHorizontal: 20, paddingBottom: 36 },
  brand: { alignItems: 'center', flexDirection: 'row', gap: 10, marginBottom: 22, marginTop: 14 },
  brandMark: { alignItems: 'center', backgroundColor: colors.forest, borderRadius: 13, height: 42, justifyContent: 'center', width: 42 },
  brandName: { color: colors.ink, fontSize: 21, fontWeight: '800', letterSpacing: -0.6 },
  brandTag: { color: colors.muted, fontSize: 9, fontWeight: '800', letterSpacing: 1.5 },
  hero: { borderRadius: 28, minHeight: 265, overflow: 'hidden', padding: 24 },
  heroCircle: { borderColor: colors.line, borderRadius: 130, borderWidth: 1, height: 260, position: 'absolute', right: -75, top: -96, width: 260 },
  heroCircleSmall: { backgroundColor: colors.orange, borderRadius: 65, height: 130, opacity: 0.25, position: 'absolute', right: -20, top: 48, width: 130 },
  heroBadge: { alignItems: 'center', flexDirection: 'row', gap: 6, marginBottom: 18 },
  heroBadgeText: { color: colors.forest, fontSize: 10, fontWeight: '800', letterSpacing: 1.4 },
  heroTitle: { color: colors.ink, fontSize: 42, fontWeight: '800', letterSpacing: -1.7, lineHeight: 45 },
  heroCopy: { color: colors.muted, fontSize: 15, marginTop: 10 },
  heroButton: { alignSelf: 'flex-start', marginTop: 24 },
  sectionTitle: { alignItems: 'flex-end', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14, marginTop: 29 },
  eyebrow: { color: colors.orangeInk, fontSize: 10, fontWeight: '800', letterSpacing: 1.5, marginBottom: 3 },
  heading: { color: colors.ink, fontWeight: '800', letterSpacing: -0.7 },
  statusPill: { alignItems: 'center', backgroundColor: colors.mint, borderRadius: 20, flexDirection: 'row', gap: 6, paddingHorizontal: 11, paddingVertical: 6 },
  statusDot: { borderRadius: 4, height: 7, width: 7 },
  statusText: { color: colors.forest, fontSize: 11, fontWeight: '800' },
  tableCard: { backgroundColor: colors.paper, borderColor: colors.line, borderRadius: 24, borderWidth: 1, gap: 16, padding: 18 },
  tableCardTop: { alignItems: 'center', flexDirection: 'row', gap: 12 },
  tableIcon: { alignItems: 'center', backgroundColor: colors.mint, borderRadius: 15, height: 52, justifyContent: 'center', width: 52 },
  tableDetails: { flex: 1 },
  cardTitle: { color: colors.ink, fontWeight: '700' },
  muted: { color: colors.muted, fontSize: 13, lineHeight: 19 },
  codeStrip: { alignItems: 'center', backgroundColor: colors.canvas, borderRadius: 16, flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  codeLabel: { color: colors.muted, fontSize: 10, fontWeight: '800', letterSpacing: 1.2 },
  codeValue: { color: colors.forest, fontSize: 22, fontWeight: '800', letterSpacing: 3 },
  actions: { flexDirection: 'row', gap: 12 },
  pdfAction: { marginTop: 14 },
  communityAction: { marginTop: 10 },
  actionCard: { borderRadius: 22, flex: 1, minHeight: 195, padding: 15 },
  actionWarm: { backgroundColor: colors.orangePale },
  actionCool: { backgroundColor: colors.mint },
  actionIcon: { alignItems: 'center', borderRadius: 14, height: 42, justifyContent: 'center', marginBottom: 10, width: 42 },
  actionTitle: { color: colors.ink, fontWeight: '800', marginBottom: 4 },
  count: { color: colors.muted, fontSize: 12, fontWeight: '700' },
  importCard: { backgroundColor: colors.paper, borderColor: colors.line, borderRadius: 22, borderWidth: 1, gap: 13, padding: 18 },
  importHeader: { alignItems: 'center', flexDirection: 'row', gap: 9 },
  gameRow: { alignItems: 'center', backgroundColor: colors.paper, borderBottomColor: colors.line, borderBottomWidth: 1, flexDirection: 'row', gap: 12, padding: 12 },
  gameMark: { alignItems: 'center', backgroundColor: colors.mint, borderRadius: 12, height: 42, justifyContent: 'center', width: 42 },
  gameDetails: { flex: 1 },
});
