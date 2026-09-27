import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ScoreTextField as TextInput } from '@decodadev02/scoreui';
import { router, useFocusEffect } from 'expo-router';
import { Text, TextInput as PasswordInput } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

import { api, baseURL } from '@/lib/api';
import { useTableScoreStore } from '@/stores/useTableScoreStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { colors } from '@/theme';
import { AppButton as Button } from '@/components/AppButton';

export default function ProfileScreen() {
  const [nameDraft, setNameDraft] = useState<string | null>(null);
  const [apiStatus, setAPIStatus] = useState<string | null>(null);
  const [checkingAPI, setCheckingAPI] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [accountName, setAccountName] = useState('');
  const [password, setPassword] = useState('');
  const { myPlayerName, username, setMyPlayerName } = useTableScoreStore();
  const { user, stats, isBusy, isRestoring, error: authError, signUp, logIn, logOut, refresh } = useAuthStore();
  const name = nameDraft ?? (myPlayerName || username || 'You');

  useFocusEffect(useCallback(() => {
    if (user) refresh().catch(() => undefined);
  }, [user, refresh]));

  async function submitAccount() {
    try {
      if (authMode === 'signup') await signUp(accountName, password);
      else await logIn(accountName, password);
      setPassword('');
    } catch { /* The account store displays the error. */ }
  }

  async function checkAPI() {
    setCheckingAPI(true);
    try {
      const health = await api.getHealth();
      setAPIStatus(health.status === 'ok' ? 'API connected.' : 'The API returned an unexpected status.');
    } catch (cause) {
      setAPIStatus(cause instanceof Error ? `Could not reach the API: ${cause.message}` : 'Could not reach the API.');
    } finally {
      setCheckingAPI(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.eyebrow}>YOUR SPACE</Text>
        <Text style={styles.title}>Player profile</Text>
        <Text style={styles.subtitle}>Keep the focus on the game.</Text>

        <View style={styles.profileCard}>
          <View style={styles.avatar}><MaterialCommunityIcons name="account-outline" size={34} color={colors.paper} /></View>
          <View style={styles.anonymousPill}><MaterialCommunityIcons name="incognito" size={15} color={colors.forest} /><Text style={styles.anonymousText}>ANONYMOUS PLAYER</Text></View>
          <Text style={styles.profileTitle}>{myPlayerName || 'You’re ready to play'}</Text>
          <Text style={styles.profileCopy}>Create tables and track scores without making an account.</Text>
        </View>

        <View style={styles.nameCard}>
          <Text style={styles.featureTitle}>MeepVP account</Text>
          {isRestoring ? <Text style={styles.featureCopy}>Restoring your account…</Text> : user ? (
            <>
              <Text style={styles.featureCopy}>Signed in as @{user.username}. Your game stats are visible only to this account.</Text>
              <View style={styles.statsRow}>
                <Text style={styles.stat}>{stats?.finishedGames ?? 0} games</Text>
                <Text style={styles.stat}>{stats?.wins ?? 0} wins</Text>
                <Text style={styles.stat}>{stats?.ties ?? 0} ties</Text>
                <Text style={styles.stat}>{stats?.totalPoints ?? 0} points</Text>
              </View>
              <Button mode="outlined" loading={isBusy} disabled={isBusy} onPress={() => logOut().catch(() => undefined)}>Log out</Button>
            </>
          ) : (
            <>
              <Text style={styles.featureCopy}>Create an account to keep your stats across devices and share sheets with the community.</Text>
              <TextInput label="Username" value={accountName} onChangeText={setAccountName} autoCapitalize="none" mode="outlined" />
              <PasswordInput label="Password" value={password} onChangeText={setPassword} secureTextEntry autoCapitalize="none" mode="outlined" />
              {authMode === 'signup' && <Text style={styles.featureCopy}>Use 3–30 letters, numbers, or underscores, and a password of at least 12 characters.</Text>}
              <Button mode="contained" loading={isBusy} disabled={isBusy || !accountName.trim() || !password} onPress={() => submitAccount().catch(() => undefined)}>{authMode === 'signup' ? 'Create account' : 'Log in'}</Button>
              <Button mode="text" onPress={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}>{authMode === 'login' ? 'New here? Create an account' : 'Already have an account? Log in'}</Button>
            </>
          )}
          {authError && <Text style={styles.authError}>{authError}</Text>}
        </View>

        <View style={styles.nameCard}>
          <Text style={styles.featureTitle}>Your player name</Text>
          <Text style={styles.featureCopy}>This name is added to new games so your score appears on the table.</Text>
          <TextInput label="Player name" value={name} onChangeText={setNameDraft} mode="outlined" />
          <Button mode="contained" disabled={!name.trim()} onPress={() => setMyPlayerName(name)}>Save name</Button>
        </View>

        <View style={styles.nameCard}>
          <Text style={styles.featureTitle}>API connection</Text>
          <Text style={styles.featureCopy}>{baseURL}</Text>
          {apiStatus && <Text style={styles.featureCopy}>{apiStatus}</Text>}
          <Button mode="outlined" loading={checkingAPI} disabled={checkingAPI} onPress={checkAPI}>Check connection</Button>
        </View>

        <Text style={styles.sectionLabel}>EXPLORE</Text>
        <View style={styles.featureCard}>
          <View style={styles.featureIcon}><MaterialCommunityIcons name="history" size={23} color={colors.forest} /></View>
          <View style={styles.featureText}><Text style={styles.featureTitle}>Game history</Text><Text style={styles.featureCopy}>View your last finished game.</Text><Button mode="text" onPress={() => router.push('/history')}>Open history</Button></View>
        </View>
        <View style={styles.featureCard}>
          <View style={[styles.featureIcon, { backgroundColor: colors.orangePale }]}><MaterialCommunityIcons name="account-group-outline" size={23} color={colors.orangeInk} /></View>
          <View style={styles.featureText}><Text style={styles.featureTitle}>Community sheets</Text><Text style={styles.featureCopy}>Find scoring rules shared by other players.</Text><Button mode="text" onPress={() => router.push('/community/rules')}>Browse sheets</Button></View>
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
  authError: { color: colors.error, fontSize: 12 },
});
