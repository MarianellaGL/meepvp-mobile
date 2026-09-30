import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { MeepleLogo } from '@decodadev02/meepleui';
import { router, useLocalSearchParams } from 'expo-router';
import { IconButton, Text, TextInput } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton as Button } from '@/components/AppButton';
import { useAuthStore } from '@/stores/useAuthStore';
import { colors } from '@/theme';

type AuthMode = 'login' | 'signup';
const usernamePattern = /^[A-Za-z0-9_]{3,30}$/;

export default function AuthScreen() {
  const { mode, entry } = useLocalSearchParams<{ mode?: string; entry?: string }>();
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
      setError('El usuario debe tener entre 3 y 30 letras, números o guiones bajos.');
      return;
    }
    if (isSignup && password.length < 12) {
      setError('La contraseña debe tener al menos 12 caracteres.');
      return;
    }
    if (isSignup && password !== confirmation) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    setError(null);
    try {
      if (isSignup) await signUp(cleanUsername, password);
      else await logIn(cleanUsername, password);
      setPassword('');
      setConfirmation('');
      if (entry === '1') router.replace('/');
      else goBack();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No pudimos acceder a tu cuenta.');
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={styles.fill} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <IconButton icon="arrow-left" iconColor={colors.ink} accessibilityLabel="Volver" onPress={goBack} style={styles.back} />
          <View style={styles.heroIcon}><MeepleLogo size={68} /></View>
          <Text style={styles.eyebrow}>CUENTA MEEPVP</Text>
          <Text style={styles.title}>{isSignup ? 'Cada partida cuenta.' : 'Qué bueno verte de nuevo.'}</Text>
          <Text style={styles.subtitle}>{isSignup ? 'Creá una cuenta para guardar tus estadísticas y compartir planillas.' : 'Iniciá sesión para ver tu historial y tus estadísticas.'}</Text>

          {user ? (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Iniciaste sesión como @{user.username}</Text>
              <Button mode="contained" onPress={goBack}>Continuar</Button>
            </View>
          ) : (
            <View style={styles.card}>
              <View style={styles.modeRow}>
                <Button mode={isSignup ? 'outlined' : 'contained'} style={styles.modeButton} onPress={() => switchMode('login')}>Iniciar sesión</Button>
                <Button mode={isSignup ? 'contained' : 'outlined'} style={styles.modeButton} onPress={() => switchMode('signup')}>Registrarse</Button>
              </View>
              <TextInput label="Usuario" value={username} onChangeText={(value) => { setUsername(value); setError(null); }} autoCapitalize="none" autoCorrect={false} autoComplete="username" textContentType="username" mode="outlined" maxLength={30} disabled={isBusy} />
              <TextInput label="Contraseña" value={password} onChangeText={(value) => { setPassword(value); setError(null); }} secureTextEntry={!showPassword} autoCapitalize="none" autoCorrect={false} autoComplete={isSignup ? 'new-password' : 'current-password'} textContentType={isSignup ? 'newPassword' : 'password'} mode="outlined" disabled={isBusy} right={<TextInput.Icon icon={showPassword ? 'eye-off' : 'eye'} onPress={() => setShowPassword((shown) => !shown)} accessibilityLabel={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'} />} />
              {isSignup && <>
                <TextInput label="Confirmar contraseña" value={confirmation} onChangeText={(value) => { setConfirmation(value); setError(null); }} secureTextEntry={!showPassword} autoCapitalize="none" autoCorrect={false} autoComplete="new-password" textContentType="newPassword" mode="outlined" disabled={isBusy} />
                <Text style={styles.hint}>Usá al menos 12 caracteres. El usuario puede contener letras, números y guiones bajos.</Text>
              </>}
              {error && <Text style={styles.error} accessibilityLiveRegion="polite">{error}</Text>}
              <Button mode="contained" loading={isBusy} disabled={isBusy || !username.trim() || !password || (isSignup && !confirmation)} onPress={() => submit().catch(() => undefined)}>{isSignup ? 'Crear cuenta' : 'Iniciar sesión'}</Button>
            </View>
          )}
          <Text style={styles.footer}>Podés jugar sin cuenta. Iniciá sesión cuando quieras guardar estadísticas o compartir una planilla.</Text>
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
  heroIcon: { alignItems: 'center', justifyContent: 'center', marginTop: 22, width: 68 },
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
