import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Button, Text, TextInput } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTableScoreStore } from '@/stores/useTableScoreStore';
import { colors } from '@/theme';

export default function ProfileScreen() {
  const [nameDraft, setNameDraft] = useState<string | null>(null);
  const { myPlayerName, username, setMyPlayerName } = useTableScoreStore();
  const name = nameDraft ?? (myPlayerName || username || 'You');
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
          <Text style={styles.featureTitle}>Your player name</Text>
          <Text style={styles.featureCopy}>This name is added to new games so your score appears on the table.</Text>
          <TextInput label="Player name" value={name} onChangeText={setNameDraft} mode="outlined" />
          <Button mode="contained" disabled={!name.trim()} onPress={() => setMyPlayerName(name)}>Save name</Button>
        </View>

        <Text style={styles.sectionLabel}>COMING LATER</Text>
        <View style={styles.featureCard}>
          <View style={styles.featureIcon}><MaterialCommunityIcons name="history" size={23} color={colors.forest} /></View>
          <View style={styles.featureText}><Text style={styles.featureTitle}>Game history</Text><Text style={styles.featureCopy}>Revisit your favorite game nights.</Text></View>
        </View>
        <View style={styles.featureCard}>
          <View style={[styles.featureIcon, { backgroundColor: colors.orangePale }]}><MaterialCommunityIcons name="account-group-outline" size={23} color={colors.orangeInk} /></View>
          <View style={styles.featureText}><Text style={styles.featureTitle}>Community sheets</Text><Text style={styles.featureCopy}>Share scoring rules with other players.</Text></View>
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
  profileCard: { alignItems: 'center', backgroundColor: colors.forest, borderRadius: 27, padding: 28 },
  avatar: { alignItems: 'center', backgroundColor: '#3D7168', borderRadius: 31, height: 62, justifyContent: 'center', marginBottom: 16, width: 62 },
  anonymousPill: { alignItems: 'center', backgroundColor: colors.mint, borderRadius: 20, flexDirection: 'row', gap: 6, paddingHorizontal: 10, paddingVertical: 6 },
  anonymousText: { color: colors.forest, fontSize: 10, fontWeight: '800', letterSpacing: 0.8 },
  profileTitle: { color: colors.paper, fontSize: 23, fontWeight: '800', letterSpacing: -0.5, marginTop: 16 },
  profileCopy: { color: '#D5E7DE', fontSize: 14, lineHeight: 21, marginTop: 7, textAlign: 'center' },
  nameCard: { backgroundColor: colors.paper, borderColor: colors.line, borderRadius: 19, borderWidth: 1, gap: 10, marginTop: 18, padding: 16 },
  sectionLabel: { color: colors.orangeInk, fontSize: 10, fontWeight: '800', letterSpacing: 1.5, marginBottom: 13, marginTop: 30 },
  featureCard: { alignItems: 'center', backgroundColor: colors.paper, borderColor: colors.line, borderRadius: 19, borderWidth: 1, flexDirection: 'row', gap: 13, marginBottom: 10, padding: 14 },
  featureIcon: { alignItems: 'center', backgroundColor: colors.mint, borderRadius: 13, height: 46, justifyContent: 'center', width: 46 },
  featureText: { flex: 1 },
  featureTitle: { color: colors.ink, fontSize: 15, fontWeight: '800' },
  featureCopy: { color: colors.muted, fontSize: 12, marginTop: 3 },
});
