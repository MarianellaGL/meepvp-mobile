import { useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { router, useLocalSearchParams } from 'expo-router';
import { IconButton, Text, TextInput } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton as Button } from '@/components/AppButton';
import { api, APIRequestError } from '@/lib/api';
import { parseTableCode } from '@/lib/tableInvite';
import { useEntryStore } from '@/stores/useEntryStore';
import { useTableScoreStore } from '@/stores/useTableScoreStore';
import { colors } from '@/theme';

export default function JoinScreen() {
  const { code: inviteCode } = useLocalSearchParams<{ code?: string }>();
  const [code, setCode] = useState(inviteCode ?? '');
  const [name, setName] = useState(useTableScoreStore.getState().myPlayerName);
  const [scanning, setScanning] = useState(false);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scanLocked = useRef(false);
  const [permission, requestPermission] = useCameraPermissions();
  const continueAsGuest = useEntryStore((state) => state.continueAsGuest);
  const hasRestored = useTableScoreStore((state) => state.hasRestored);
  const loadSession = useTableScoreStore((state) => state.loadSession);
  const joinSessionAsMe = useTableScoreStore((state) => state.joinSessionAsMe);

  async function joinWithCode(rawCode: string) {
    const tableCode = parseTableCode(rawCode);
    if (!tableCode) {
      setError('Ingresá un código de mesa válido de 6 caracteres.');
      return;
    }
    if (!name.trim()) {
      setCode(tableCode);
      setError('Ingresá tu nombre para aparecer en la partida.');
      return;
    }
    setJoining(true);
    setError(null);
    try {
      const session = await api.currentSessionByTable(tableCode);
      await loadSession(session.id);
      await joinSessionAsMe(name);
      continueAsGuest();
      router.replace(`/sessions/${session.id}`);
    } catch (cause) {
      setError(cause instanceof APIRequestError && cause.status === 404
        ? 'No hay una partida activa con ese código. Pedile el código actualizado al anfitrión.'
        : cause instanceof Error ? cause.message : 'No pudimos unirnos a la partida.');
    } finally {
      setJoining(false);
    }
  }

  async function openScanner() {
    setError(null);
    const cameraPermission = permission?.granted ? permission : await requestPermission();
    if (!cameraPermission.granted) {
      setError('Necesitamos permiso para usar la cámara. También podés ingresar el código a mano.');
      return;
    }
    scanLocked.current = false;
    setScanning(true);
  }

  function scanned(data: string) {
    if (scanLocked.current) return;
    scanLocked.current = true;
    const tableCode = parseTableCode(data);
    if (!tableCode) {
      setError('Este QR no pertenece a una mesa de MeepVP.');
      scanLocked.current = false;
      return;
    }
    setCode(tableCode);
    setScanning(false);
    if (name.trim()) joinWithCode(tableCode).catch(() => undefined);
    else setError('QR leído. Ingresá tu nombre y tocá “Unirme a la partida”.');
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={styles.fill} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <IconButton icon="arrow-left" iconColor={colors.ink} accessibilityLabel="Volver" onPress={() => router.canGoBack() ? router.back() : router.replace('/welcome')} style={styles.back} />
          <Text style={styles.eyebrow}>JUGAR EN GRUPO</Text>
          <Text style={styles.title}>Unite a la partida.</Text>
          <Text style={styles.copy}>Escaneá el QR del anfitrión o escribí el código de la mesa. No necesitás una cuenta.</Text>
          <View style={styles.card}>
            <TextInput label="Tu nombre" value={name} onChangeText={(value) => { setName(value); setError(null); }} mode="outlined" autoCapitalize="words" maxLength={50} disabled={joining} />
            <TextInput label="Código de mesa" value={code} onChangeText={(value) => { setCode(value.toUpperCase()); setError(null); }} mode="outlined" autoCapitalize="characters" autoCorrect={false} maxLength={80} disabled={joining} />
            <Button mode="outlined" icon="qrcode-scan" disabled={joining || !hasRestored} onPress={() => scanning ? setScanning(false) : openScanner().catch(() => setError('No pudimos abrir la cámara.'))}>{scanning ? 'Cerrar cámara' : 'Escanear QR'}</Button>
            {scanning && <View style={styles.cameraFrame}><CameraView style={styles.camera} facing="back" barcodeScannerSettings={{ barcodeTypes: ['qr'] }} onBarcodeScanned={({ data }) => scanned(data)} /></View>}
            {error && <Text style={styles.error} accessibilityLiveRegion="polite">{error}</Text>}
            <Button mode="contained" loading={joining} disabled={joining || !hasRestored || !name.trim() || !code.trim()} onPress={() => joinWithCode(code).catch(() => undefined)}>Unirme a la partida</Button>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { backgroundColor: colors.canvas, flex: 1 },
  fill: { flex: 1 },
  content: { flexGrow: 1, padding: 20, paddingBottom: 38 },
  back: { marginLeft: -12 },
  eyebrow: { color: colors.orangeInk, fontSize: 11, fontWeight: '800', letterSpacing: 1.4, marginTop: 30 },
  title: { color: colors.ink, fontSize: 34, fontWeight: '800', letterSpacing: -1, marginTop: 8 },
  copy: { color: colors.muted, fontSize: 15, lineHeight: 22, marginTop: 8 },
  card: { backgroundColor: colors.paper, borderColor: colors.line, borderRadius: 22, borderWidth: 1, gap: 15, marginTop: 30, padding: 18 },
  cameraFrame: { borderRadius: 16, height: 280, overflow: 'hidden' },
  camera: { flex: 1 },
  error: { color: colors.error, fontSize: 13, lineHeight: 19 },
});
