import { ScrollView, StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton as Button } from '@/components/AppButton';
import { useEntryStore } from '@/stores/useEntryStore';
import { colors } from '@/theme';

export default function WelcomeScreen() {
  const continueAsGuest = useEntryStore((state) => state.continueAsGuest);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.mark}><MaterialCommunityIcons name="dice-multiple" size={38} color={colors.canvas} /></View>
        <Text style={styles.brand}>MeepVP</Text>
        <Text style={styles.title}>Tu partida empieza acá.</Text>
        <Text style={styles.copy}>Llevá los puntos, compartí planillas y descubrí quién ganó. Elegí cómo querés entrar.</Text>

        <View style={styles.actions}>
          <Button mode="contained" icon="account-plus-outline" onPress={() => router.push({ pathname: '/auth', params: { mode: 'signup', entry: '1' } })}>Registrarse</Button>
          <Button mode="outlined" icon="login" onPress={() => router.push({ pathname: '/auth', params: { entry: '1' } })}>Iniciar sesión</Button>
          <Button mode="outlined" icon="account-outline" onPress={() => { continueAsGuest(); router.replace('/'); }}>Continuar sin cuenta</Button>
          <Button mode="outlined" icon="qrcode-scan" onPress={() => { continueAsGuest(); router.push('/join'); }}>Unirse a una partida</Button>
        </View>
        <Text style={styles.note}>Podés jugar sin cuenta. Para guardar tus estadísticas y compartir planillas, registrate cuando quieras.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { backgroundColor: colors.canvas, flex: 1 },
  content: { flexGrow: 1, justifyContent: 'center', padding: 24, paddingBottom: 42 },
  mark: { alignItems: 'center', backgroundColor: colors.forest, borderRadius: 26, height: 76, justifyContent: 'center', width: 76 },
  brand: { color: colors.orangeInk, fontSize: 13, fontWeight: '800', letterSpacing: 2, marginTop: 28 },
  title: { color: colors.ink, fontSize: 38, fontWeight: '800', letterSpacing: -1.5, lineHeight: 43, marginTop: 9 },
  copy: { color: colors.muted, fontSize: 16, lineHeight: 24, marginTop: 14 },
  actions: { gap: 12, marginTop: 36 },
  note: { color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: 28, textAlign: 'center' },
});
