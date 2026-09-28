import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Redirect, router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ScoreTextField as TextInput } from '@decodadev02/scoreui';
import { ActivityIndicator, HelperText, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTableScoreStore } from '@/stores/useTableScoreStore';
import { colors } from '@/theme';
import { AppButton as Button } from '@/components/AppButton';
import { TableQRCode } from '@/components/TableQRCode';
import { useAuthStore } from '@/stores/useAuthStore';
import { useEntryStore } from '@/stores/useEntryStore';

export default function DashboardScreen() {
  const [usernameDraft, setUsernameDraft] = useState<string | null>(null);
  const [tableName, setTableName] = useState('');
  const store = useTableScoreStore();
  const activeSession = store.session?.status === 'active' ? store.session : null;
  const pausedSession = store.session?.status === 'paused' ? store.session : null;
  const currentSession = activeSession ?? pausedSession;
  const authReady = useAuthStore((state) => state.hasRestored);
  const user = useAuthStore((state) => state.user);
  const entered = useEntryStore((state) => state.entered);
  const username = usernameDraft ?? store.username;

  async function createTable() {
    try { await store.createTable(tableName); } catch { /* The store displays the error. */ }
  }

  async function importCollection() {
    if (!username.trim()) return;
    try { await store.loadCollection(username); } catch { /* The store displays the error. */ }
  }

  function openGame() {
    if (currentSession) router.push(`/sessions/${currentSession.id}`);
    else if (store.table) router.push('/sessions/new');
    else createTable();
  }

  if (!authReady) return <SafeAreaView style={styles.safe}><ActivityIndicator style={{ marginTop: 80 }} /></SafeAreaView>;
  if (!user && !entered) return <Redirect href="/welcome" />;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.brand}>
          <View style={styles.brandMark}><MaterialCommunityIcons name="dice-multiple" color={colors.canvas} size={22} /></View>
          <View>
            <Text style={styles.brandName}>MeppVP</Text>
            <Text style={styles.brandTag}>TU MESA, TUS REGLAS</Text>
          </View>
        </View>

        <LinearGradient colors={[colors.forestDark, colors.paper, colors.orangePale]} style={styles.hero}>
          <View style={styles.heroCircle} />
          <View style={styles.heroCircleSmall} />
          <View style={styles.heroBadge}>
            <MaterialCommunityIcons name="cards-outline" color={colors.forest} size={16} />
            <Text style={styles.heroBadgeText}>TODO LISTO PARA JUGAR</Text>
          </View>
          <Text style={styles.heroTitle}>Jugá más.{'\n'}Contá menos.</Text>
          <Text style={styles.heroCopy}>Menos cuentas, más juego.</Text>
          <Button
            mode="contained"
            icon={currentSession ? 'arrow-right' : 'qrcode-scan'}
            loading={store.isCreatingTable}
            disabled={!store.hasRestored || store.isRestoring}
            onPress={() => currentSession ? router.push(`/sessions/${currentSession.id}`) : router.push('/join')}
            style={styles.heroButton}
          >
            {currentSession ? pausedSession ? 'Retomar partida pausada' : 'Volver a la partida' : 'Unirse a una partida'}
          </Button>
        </LinearGradient>

        <View style={styles.sectionTitle}>
          <View>
            <Text style={styles.eyebrow}>LA MESA</Text>
            <Text variant="headlineSmall" style={styles.heading}>{currentSession ? 'Tu partida' : 'Tu próxima partida'}</Text>
          </View>
          <View style={styles.statusPill}>
            <View style={[styles.statusDot, { backgroundColor: currentSession || store.table ? colors.forest : colors.orange }]} />
            <Text style={styles.statusText}>{pausedSession ? 'Pausada' : activeSession ? 'En curso' : store.table ? 'Lista' : 'Nueva'}</Text>
          </View>
        </View>

        <View style={styles.tableCard}>
          {!store.hasRestored || store.isRestoring ? (
            <ActivityIndicator />
          ) : store.table || currentSession ? (
            <>
              <View style={styles.tableCardTop}>
                <View style={styles.tableIcon}><MaterialCommunityIcons name="table-furniture" color={colors.forest} size={24} /></View>
                <View style={styles.tableDetails}>
                  <Text variant="titleLarge" style={styles.cardTitle}>{currentSession ? store.rules.find((rule) => rule.id === currentSession.ruleId)?.gameName ?? 'Partida en curso' : 'Mesa lista para jugar'}</Text>
                  <Text style={styles.muted}>{pausedSession ? 'Pausada para continuar otro día' : activeSession ? 'Hay una partida en curso' : 'No hay una partida en curso'}</Text>
                </View>
              </View>
              {activeSession && <View style={styles.codeStrip}>
                <Text style={styles.codeLabel}>CÓDIGO DE MESA</Text>
                <Text style={styles.codeValue}>{activeSession.tableCode}</Text>
              </View>}
              {activeSession && <TableQRCode code={activeSession.tableCode} />}
              <Button mode="contained" icon="arrow-right" onPress={openGame}>
                {pausedSession ? 'Ver partida pausada' : activeSession ? 'Abrir partida' : 'Empezar una partida'}
              </Button>
            </>
          ) : (
            <>
              <View style={styles.tableCardTop}>
                <View style={styles.tableIcon}><MaterialCommunityIcons name="account-group-outline" color={colors.forest} size={25} /></View>
                <View style={styles.tableDetails}>
                  <Text variant="titleLarge" style={styles.cardTitle}>Hay lugar para todos</Text>
                  <Text style={styles.muted}>Creá una mesa y compartí su código. No hace falta registrarse.</Text>
                </View>
              </View>
              <TextInput label="Nombre de la mesa" placeholder="Noche de juegos" value={tableName} onChangeText={setTableName} mode="outlined" />
              <Button mode="contained" icon="plus" loading={store.isCreatingTable} onPress={createTable}>Crear mesa</Button>
            </>
          )}
        </View>

        <View style={styles.sectionTitle}>
          <View>
            <Text style={styles.eyebrow}>A TU MANERA</Text>
            <Text variant="headlineSmall" style={styles.heading}>Acciones rápidas</Text>
          </View>
        </View>
        <View style={styles.actions}>
          <View style={[styles.actionCard, styles.actionWarm]}>
            <View style={[styles.actionIcon, { backgroundColor: colors.orangePale }]}>
              <MaterialCommunityIcons name="table-edit" color={colors.orangeInk} size={25} />
            </View>
            <Text variant="titleMedium" style={styles.actionTitle}>Planilla de puntos</Text>
            <Text style={styles.muted}>Armá reglas para tu juego.</Text>
            <Button mode="text" icon="arrow-right" onPress={() => router.push('/rules/new')}>Crear</Button>
          </View>
          <View style={[styles.actionCard, styles.actionCool]}>
            <View style={[styles.actionIcon, { backgroundColor: colors.mint }]}>
              <MaterialCommunityIcons name="bookshelf" color={colors.forest} size={25} />
            </View>
            <Text variant="titleMedium" style={styles.actionTitle}>Tu biblioteca</Text>
            <Text style={styles.muted}>Tené tus juegos favoritos a mano.</Text>
            <Button mode="text" icon="arrow-right" onPress={() => router.push('/library')}>Explorar</Button>
          </View>
        </View>

        <Button mode="contained-tonal" icon="file-pdf-box" style={styles.pdfAction} onPress={() => router.push('/pdf/reader')}>Subir reglamento en PDF</Button>
        <Button mode="outlined" icon="account-group-outline" style={styles.communityAction} onPress={() => router.push('/community/rules')}>Buscar planillas de la comunidad</Button>
        <Button mode="outlined" icon="calendar-plus" style={styles.communityAction} onPress={() => router.push('/schedule')}>Programar una partida</Button>

        <View style={styles.sectionTitle}>
          <View>
            <Text style={styles.eyebrow}>TU COLECCIÓN</Text>
            <Text variant="headlineSmall" style={styles.heading}>Traé tus juegos</Text>
          </View>
          <Text style={styles.count}>{store.collection.length} juegos</Text>
        </View>
        <View style={styles.importCard}>
          <View style={styles.importHeader}>
            <MaterialCommunityIcons name="database-import-outline" color={colors.forest} size={23} />
            <Text variant="titleMedium" style={styles.cardTitle}>Conectar BoardGameGeek</Text>
          </View>
          <Text style={styles.muted}>Ingresá tu usuario de BGG para ver tu colección acá.</Text>
          <TextInput label="Usuario de BGG" value={username} onChangeText={setUsernameDraft} autoCapitalize="none" mode="outlined" />
          <Button mode="outlined" icon="download" loading={store.isLoadingCollection} disabled={!store.hasRestored || !username.trim()} onPress={importCollection}>Importar colección</Button>
        </View>
        {store.error && <HelperText type="error" visible>{store.error}</HelperText>}
        {store.collectionStatus && <HelperText type="info" visible>{store.collectionStatus}</HelperText>}
        {store.collection.slice(0, 3).map((game) => (
          <View key={game.bggId} style={styles.gameRow}>
            <View style={styles.gameMark}><MaterialCommunityIcons name="dice-5-outline" color={colors.forest} size={22} /></View>
            <View style={styles.gameDetails}>
              <Text variant="titleSmall">{game.name}</Text>
              <Text style={styles.muted}>{game.yearPublished || 'Año desconocido'} · {game.minPlayers ?? '?'}–{game.maxPlayers ?? '?'} jugadores</Text>
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
