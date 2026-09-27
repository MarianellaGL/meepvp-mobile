import { StyleSheet, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { Text } from 'react-native-paper';

import { tableInviteURL } from '@/lib/tableInvite';
import { colors } from '@/theme';

export function TableQRCode({ code }: { code: string }) {
  return (
    <View style={styles.card}>
      <View style={styles.qr}><QRCode value={tableInviteURL(code)} size={176} backgroundColor="#FFFFFF" color="#161616" /></View>
      <Text style={styles.title}>Escaneá para unirte</Text>
      <Text style={styles.copy}>Compartí este QR o el código {code} con quienes juegan.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { alignItems: 'center', backgroundColor: colors.paper, borderColor: colors.line, borderRadius: 20, borderWidth: 1, gap: 8, padding: 18 },
  qr: { backgroundColor: '#FFFFFF', borderRadius: 14, padding: 12 },
  title: { color: colors.ink, fontSize: 16, fontWeight: '800', marginTop: 5 },
  copy: { color: colors.muted, fontSize: 12, lineHeight: 18, textAlign: 'center' },
});
