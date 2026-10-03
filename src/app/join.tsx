import { useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { router, useLocalSearchParams } from 'expo-router';
import { ScoreButton, ScoreTextField } from '@decodadev02/meepleui';

import { api, APIRequestError } from '@/lib/api';
import { parseTableCode } from '@/lib/tableInvite';
import { Hint, Section } from '@/shared/ui/Section';
import { Screen } from '@/shared/ui/Screen';
import { useEntryStore } from '@/stores/useEntryStore';
import { useTableScoreStore } from '@/stores/useTableScoreStore';
import { tokens } from '@/theme';

export default function JoinScreen() {
  const { code: inviteCode } = useLocalSearchParams<{ code?: string }>();
  const [code, setCode] = useState(inviteCode ?? '');
  // The name from the last game is remembered, so it is usually one tap.
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
  const tableCode = parseTableCode(code);

  async function joinWithCode(rawCode: string) {
    const parsed = parseTableCode(rawCode);
    if (!parsed) { setError('El código tiene 6 letras o números. Revisalo o escaneá el QR.'); return; }
    if (!name.trim()) { setCode(parsed); setError('Escribí tu nombre para aparecer en la partida.'); return; }
    setJoining(true);
    setError(null);
    try {
      const session = await api.currentSessionByTable(parsed);
      if (session.status === 'paused') {
        setError('Esta partida está pausada. Pedile al anfitrión que la reanude para unirte.');
        return;
      }
      await loadSession(session.id);
      await joinSessionAsMe(name.trim());
      continueAsGuest();
      router.replace(`/sessions/${session.id}`);
    } catch (cause) {
      setError(cause instanceof APIRequestError && cause.status === 404
        ? 'No hay una partida con ese código. Pedile al anfitrión el código actualizado.'
        : cause instanceof Error ? cause.message : 'No pudimos unirte a la partida.');
    } finally {
      setJoining(false);
    }
  }

  async function openScanner() {
    setError(null);
    const cameraPermission = permission?.granted ? permission : await requestPermission();
    if (!cameraPermission.granted) {
      setError('Sin permiso para la cámara. Podés escribir el código a mano.');
      return;
    }
    scanLocked.current = false;
    setScanning(true);
  }

  function scanned(data: string) {
    if (scanLocked.current) return;
    scanLocked.current = true;
    const parsed = parseTableCode(data);
    if (!parsed) {
      setError('Este QR no es de una partida de MeepVP.');
      scanLocked.current = false;
      return;
    }
    setCode(parsed);
    setScanning(false);
    if (name.trim()) joinWithCode(parsed).catch(() => undefined);
    else setError('Listo, leímos el QR. Escribí tu nombre y tocá «Unirme».');
  }

  return <Screen eyebrow="UNIRSE" title="Unite a la partida" subtitle="Escaneá el QR del anfitrión o escribí el código. No necesitás cuenta." onBack={() => router.canGoBack() ? router.back() : router.replace('/welcome')}
    footer={<ScoreButton label="Unirme" icon="login" loading={joining} disabled={joining || !hasRestored || !name.trim() || !tableCode} onPress={() => void joinWithCode(code)} />}
  >
    <ScoreButton label={scanning ? 'Cerrar cámara' : 'Escanear QR'} icon="qrcode-scan" variant={scanning ? 'tertiary' : 'secondary'} disabled={joining || !hasRestored} onPress={() => scanning ? setScanning(false) : void openScanner().catch(() => setError('No pudimos abrir la cámara.'))} />
    {scanning && <View style={styles.camera}><CameraView style={styles.fill} facing="back" barcodeScannerSettings={{ barcodeTypes: ['qr'] }} onBarcodeScanned={({ data }) => scanned(data)} /></View>}
    <Section label="O CON EL CÓDIGO">
      <ScoreTextField label="Código de la partida" placeholder="Ej. BC4C91" value={code} onChangeText={(value) => { setCode(value.toUpperCase()); setError(null); }} autoCapitalize="characters" />
      <ScoreTextField label="Tu nombre" placeholder="Cómo te ven los demás" value={name} onChangeText={(value) => { setName(value); setError(null); }} returnKeyType="go" onSubmitEditing={() => void joinWithCode(code)} />
    </Section>
    {error && <Hint tone="error">{error}</Hint>}
  </Screen>;
}

const styles = StyleSheet.create({
  camera: { borderRadius: tokens.radius.large, height: 280, overflow: 'hidden' },
  fill: { flex: 1 },
});
