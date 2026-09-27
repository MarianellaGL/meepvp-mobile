import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ScoreTextField as TextInput } from '@decodadev02/scoreui';
import { router, useFocusEffect } from 'expo-router';
import { Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTableScoreStore } from '@/stores/useTableScoreStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { colors } from '@/theme';
import { AppButton as Button } from '@/components/AppButton';

export default function ProfileScreen() {
  const [nameDraft, setNameDraft] = useState<string | null>(null);
  const { myPlayerName, username, setMyPlayerName } = useTableScoreStore();
  const { user, stats, isBusy, isRestoring, error: authError, logOut, refresh } = useAuthStore();
  const name = nameDraft ?? (myPlayerName || username || 'Vos');

  useFocusEffect(useCallback(() => {
    if (user) refresh().catch(() => undefined);
  }, [user, refresh]));

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.eyebrow}>TU ESPACIO</Text>
        <Text style={styles.title}>Perfil de jugador</Text>
        <Text style={styles.subtitle}>Concentrate en la partida.</Text>

        <View style={styles.profileCard}>
          <View style={styles.avatar}><MaterialCommunityIcons name="account-outline" size={34} color={colors.paper} /></View>
          <View style={styles.anonymousPill}><MaterialCommunityIcons name={user ? 'account-check-outline' : 'incognito'} size={15} color={colors.forest} /><Text style={styles.anonymousText}>{user ? `@${user.username}` : 'JUGADOR SIN CUENTA'}</Text></View>
          <Text style={styles.profileTitle}>{myPlayerName || 'Listo para jugar'}</Text>
          <Text style={styles.profileCopy}>{user ? 'Tus partidas y estadísticas están vinculadas a tu cuenta.' : 'Creá mesas y llevá los puntos sin crear una cuenta.'}</Text>
        </View>

        <View style={styles.nameCard}>
          <Text style={styles.featureTitle}>Cuenta MeepVP</Text>
          {isRestoring ? <Text style={styles.featureCopy}>Recuperando tu cuenta…</Text> : user ? (
            <>
              <Text style={styles.featureCopy}>Sesión iniciada como @{user.username}. Tus estadísticas solo aparecen en esta cuenta.</Text>
              <View style={styles.statsRow}>
                <Text style={styles.stat}>{stats?.finishedGames ?? 0} partidas</Text>
                <Text style={styles.stat}>{stats?.wins ?? 0} victorias</Text>
                <Text style={styles.stat}>{stats?.ties ?? 0} empates</Text>
                <Text style={styles.stat}>{stats?.totalPoints ?? 0} puntos</Text>
              </View>
              <Button mode="outlined" loading={isBusy} disabled={isBusy} onPress={() => logOut().catch(() => undefined)}>Cerrar sesión</Button>
            </>
          ) : (
            <>
              <Text style={styles.featureCopy}>Creá una cuenta para conservar tus estadísticas y compartir planillas con la comunidad.</Text>
              <View style={styles.authActions}>
                <Button mode="contained" style={styles.authAction} onPress={() => router.push('/auth')}>Iniciar sesión</Button>
                <Button mode="outlined" style={styles.authAction} onPress={() => router.push({ pathname: '/auth', params: { mode: 'signup' } })}>Registrarse</Button>
              </View>
            </>
          )}
          {user && authError && <Text style={styles.authError}>{authError}</Text>}
        </View>

        <View style={styles.nameCard}>
          <Text style={styles.featureTitle}>Tu nombre de jugador</Text>
          <Text style={styles.featureCopy}>Este nombre aparece en tus próximas partidas y en la tabla de puntos.</Text>
          <TextInput label="Nombre de jugador" value={name} onChangeText={setNameDraft} mode="outlined" />
          <Button mode="contained" disabled={!name.trim()} onPress={() => setMyPlayerName(name)}>Guardar nombre</Button>
        </View>

        <View style={styles.nameCard}>
          <Text style={styles.featureTitle}>Listado de juegos</Text>
          <Text style={styles.featureCopy}>Explorá los juegos que importaste a tu colección.</Text>
          <Button mode="outlined" icon="bookshelf" onPress={() => router.push('/games')}>Ver listado de juegos</Button>
        </View>

        <Text style={styles.sectionLabel}>EXPLORAR</Text>
        <View style={styles.featureCard}>
          <View style={styles.featureIcon}><MaterialCommunityIcons name="history" size={23} color={colors.forest} /></View>
          <View style={styles.featureText}><Text style={styles.featureTitle}>Historial de partidas</Text><Text style={styles.featureCopy}>Volvé a ver tus partidas terminadas.</Text><Button mode="text" onPress={() => router.push('/history')}>Abrir historial</Button></View>
        </View>
        <View style={styles.featureCard}>
          <View style={[styles.featureIcon, { backgroundColor: colors.orangePale }]}><MaterialCommunityIcons name="account-group-outline" size={23} color={colors.orangeInk} /></View>
          <View style={styles.featureText}><Text style={styles.featureTitle}>Planillas de la comunidad</Text><Text style={styles.featureCopy}>Encontrá reglas compartidas por otros jugadores.</Text><Button mode="text" onPress={() => router.push('/community/rules')}>Ver planillas</Button></View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.canvas },
  content: { padding: 20, paddingBottom: 36 },
  eyebrow: { color: colors.orangeInk, fontSize: 10, fontWeight: '800', letterSpacing: 1.5, marginTop: 10 },
  title: { color: colors.ink, fontSize: 34, fontWeight: '800', letterSpacing: -1.2, marginTop: 4 },
  subtitle: { color: colors.muted, fontSize: 15, marginBottom: 28, marginTop: 5 },
  profileCard: { alignItems: 'center', backgroundColor: colors.paper, borderColor: colors.forest, borderRadius: 27, borderWidth: 1, padding: 28 },
  avatar: { alignItems: 'center', backgroundColor: colors.mint, borderRadius: 31, height: 62, justifyContent: 'center', marginBottom: 16, width: 62 },
  anonymousPill: { alignItems: 'center', backgroundColor: colors.mint, borderRadius: 20, flexDirection: 'row', gap: 6, paddingHorizontal: 10, paddingVertical: 6 },
  anonymousText: { color: colors.forest, fontSize: 10, fontWeight: '800', letterSpacing: 0.8 },
  profileTitle: { color: colors.ink, fontSize: 23, fontWeight: '800', letterSpacing: -0.5, marginTop: 16 },
  profileCopy: { color: colors.muted, fontSize: 14, lineHeight: 21, marginTop: 7, textAlign: 'center' },
  nameCard: { backgroundColor: colors.paper, borderColor: colors.line, borderRadius: 19, borderWidth: 1, gap: 10, marginTop: 18, padding: 16 },
  sectionLabel: { color: colors.orangeInk, fontSize: 10, fontWeight: '800', letterSpacing: 1.5, marginBottom: 13, marginTop: 30 },
  featureCard: { alignItems: 'center', backgroundColor: colors.paper, borderColor: colors.line, borderRadius: 19, borderWidth: 1, flexDirection: 'row', gap: 13, marginBottom: 10, padding: 14 },
  featureIcon: { alignItems: 'center', backgroundColor: colors.mint, borderRadius: 13, height: 46, justifyContent: 'center', width: 46 },
  featureText: { flex: 1 },
  featureTitle: { color: colors.ink, fontSize: 15, fontWeight: '800' },
  featureCopy: { color: colors.muted, fontSize: 12, marginTop: 3 },
  statsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  stat: { backgroundColor: colors.mint, borderRadius: 10, color: colors.forest, fontSize: 12, fontWeight: '800', padding: 9 },
  authActions: { flexDirection: 'row', gap: 10 },
  authAction: { flex: 1 },
  authError: { color: colors.error, fontSize: 12 },
});
