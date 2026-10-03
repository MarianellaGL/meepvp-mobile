import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MeepleLogo, ScoreButton } from '@decodadev02/meepleui';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useEntryStore } from '@/stores/useEntryStore';
import { tokens } from '@/theme';

export default function WelcomeScreen() {
  const continueAsGuest = useEntryStore((state) => state.continueAsGuest);

  return <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
    <View style={styles.content}>
      <View style={styles.brand}>
        <MeepleLogo size={56} />
        <Text style={styles.wordmark}>MeepVP</Text>
      </View>
      <View style={styles.copy}>
        <Text style={styles.title}>Reglas y puntos para cualquier juego de mesa.</Text>
        <Text style={styles.lede}>Buscá un juego, armá su planilla y jugá con tu grupo. Sin cuenta.</Text>
      </View>
      <View style={styles.actions}>
        <ScoreButton label="Empezar" icon="arrow-right" onPress={() => { continueAsGuest(); router.replace('/'); }} />
        <ScoreButton label="Unirme a una partida" icon="qrcode-scan" variant="secondary" onPress={() => { continueAsGuest(); router.push('/join'); }} />
        <Pressable accessibilityRole="link" onPress={() => router.push({ pathname: '/auth', params: { entry: '1' } })} style={styles.account}>
          <Text style={styles.accountText}>¿Ya tenés cuenta? <Text style={styles.accountLink}>Iniciar sesión</Text></Text>
        </Pressable>
      </View>
    </View>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  safe: { backgroundColor: tokens.color.canvas, flex: 1 },
  content: { flex: 1, gap: tokens.space.xl, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: tokens.space.lg },
  brand: { alignItems: 'center', flexDirection: 'row', gap: 12 },
  wordmark: { color: tokens.color.gold, fontFamily: tokens.font.brand, fontSize: 28 },
  copy: { gap: tokens.space.sm },
  title: { color: tokens.color.primaryText, fontFamily: tokens.font.heading, fontSize: 30, lineHeight: 38 },
  lede: { color: tokens.color.secondaryText, fontFamily: tokens.font.body, fontSize: 16, lineHeight: 23 },
  actions: { gap: tokens.space.sm },
  account: { alignItems: 'center', paddingVertical: tokens.space.sm },
  accountText: { color: tokens.color.secondaryText, fontFamily: tokens.font.body, fontSize: 14 },
  accountLink: { color: tokens.color.gold, fontFamily: tokens.font.semibold },
});
