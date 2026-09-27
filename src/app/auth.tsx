import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { IconButton, Text, TextInput } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton as Button } from '@/components/AppButton';
import { useAuthStore } from '@/stores/useAuthStore';
import { colors } from '@/theme';

type AuthMode = 'login' | 'signup';
const usernamePattern = /^[A-Za-z0-9_]{3,30}$/;

export default function AuthScreen() {
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  const [authMode, setAuthMode] = useState<AuthMode>(mode === 'signup' ? 'signup' : 'login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user, isBusy, signUp, logIn } = useAuthStore();
  const isSignup = authMode === 'signup';

  function goBack() {
    if (router.canGoBack()) router.back();
    else router.replace('/profile');
  }

  function switchMode(next: AuthMode) {
    setAuthMode(next);
    setPassword('');
    setConfirmation('');
    setError(null);
  }

  async function submit() {
    const cleanUsername = username.trim();
    if (!usernamePattern.test(cleanUsername)) {
      setError('Use 3–30 letters, numbers, or underscores for your username.');
      return;
    }
    if (isSignup && password.length < 12) {
      setError('Your password needs at least 12 characters.');
      return;
    }
    if (isSignup && password !== confirmation) {
      setError('The passwords do not match.');
      return;
    }
    setError(null);
    try {
      if (isSignup) await signUp(cleanUsername, password);
      else await logIn(cleanUsername, password);
      setPassword('');
      setConfirmation('');
      goBack();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not access your account.');
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={styles.fill} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <IconButton icon="arrow-left" iconColor={colors.ink} accessibilityLabel="Back" onPress={goBack} style={styles.back} />
          <View style={styles.heroIcon}><MaterialCommunityIcons name="dice-multiple-outline" size={36} color={colors.forest} /></View>
          <Text style={styles.eyebrow}>MEEPVP ACCOUNT</Text>
          <Text style={styles.title}>{isSignup ? 'Make every game count.' : 'Welcome back.'}</Text>
          <Text style={styles.subtitle}>{isSignup ? 'Create an account to keep your stats and share scoring sheets.' : 'Log in to see your game history and keep your stats together.'}</Text>

          {user ? (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>You’re signed in as @{user.username}</Text>
              <Button mode="contained" onPress={goBack}>Continue</Button>
            </View>
          ) : (
            <View style={styles.card}>
              <View style={styles.modeRow}>
                <Button mode={isSignup ? 'outlined' : 'contained'} style={styles.modeButton} onPress={() => switchMode('login')}>Log in</Button>
                <Button mode={isSignup ? 'contained' : 'outlined'} style={styles.modeButton} onPress={() => switchMode('signup')}>Sign up</Button>
              </View>
              <TextInput label="Username" value={username} onChangeText={(value) => { setUsername(value); setError(null); }} autoCapitalize="none" autoCorrect={false} autoComplete="username" textContentType="username" mode="outlined" maxLength={30} disabled={isBusy} />
              <TextInput label="Password" value={password} onChangeText={(value) => { setPassword(value); setError(null); }} secureTextEntry={!showPassword} autoCapitalize="none" autoCorrect={false} autoComplete={isSignup ? 'new-password' : 'current-password'} textContentType={isSignup ? 'newPassword' : 'password'} mode="outlined" disabled={isBusy} right={<TextInput.Icon icon={showPassword ? 'eye-off' : 'eye'} onPress={() => setShowPassword((shown) => !shown)} accessibilityLabel={showPassword ? 'Hide password' : 'Show password'} />} />
              {isSignup && <>
                <TextInput label="Confirm password" value={confirmation} onChangeText={(value) => { setConfirmation(value); setError(null); }} secureTextEntry={!showPassword} autoCapitalize="none" autoCorrect={false} autoComplete="new-password" textContentType="newPassword" mode="outlined" disabled={isBusy} />
                <Text style={styles.hint}>Use at least 12 characters. Your username can contain letters, numbers, and underscores.</Text>
              </>}
              {error && <Text style={styles.error} accessibilityLiveRegion="polite">{error}</Text>}
              <Button mode="contained" loading={isBusy} disabled={isBusy || !username.trim() || !password || (isSignup && !confirmation)} onPress={() => submit().catch(() => undefined)}>{isSignup ? 'Create account' : 'Log in'}</Button>
            </View>
          )}
          <Text style={styles.footer}>You can play without an account. Sign in when you want to save stats or share a sheet.</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { backgroundColor: colors.canvas, flex: 1 },
  fill: { flex: 1 },
  content: { flexGrow: 1, padding: 20, paddingBottom: 36 },
  back: { marginLeft: -12 },
  heroIcon: { alignItems: 'center', backgroundColor: colors.mint, borderRadius: 22, height: 68, justifyContent: 'center', marginTop: 22, width: 68 },
  eyebrow: { color: colors.orangeInk, fontSize: 11, fontWeight: '800', letterSpacing: 1.4, marginTop: 22 },
  title: { color: colors.ink, fontSize: 34, fontWeight: '800', letterSpacing: -1, marginTop: 8 },
  subtitle: { color: colors.muted, fontSize: 15, lineHeight: 22, marginTop: 8 },
  card: { backgroundColor: colors.paper, borderColor: colors.line, borderRadius: 22, borderWidth: 1, gap: 14, marginTop: 28, padding: 18 },
  cardTitle: { color: colors.ink, fontSize: 18, fontWeight: '800' },
  modeRow: { flexDirection: 'row', gap: 10, marginBottom: 4 },
  modeButton: { flex: 1 },
  hint: { color: colors.muted, fontSize: 12, lineHeight: 18 },
  error: { color: colors.error, fontSize: 13, lineHeight: 19 },
  footer: { color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: 24, textAlign: 'center' },
});
