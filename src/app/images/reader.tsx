import { useState } from 'react';
import { Image, ScrollView, StyleSheet, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { IconButton, Text, TextInput } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton as Button } from '@/components/AppButton';
import { readImageText } from '@/lib/imageOCR';
import { useTableScoreStore } from '@/stores/useTableScoreStore';
import { colors } from '@/theme';

export default function ImageReaderScreen() {
  const { game, gameId } = useLocalSearchParams<{ game?: string; gameId?: string }>();
  const [gameName, setGameName] = useState(game ?? '');
  const [imageURI, setImageURI] = useState<string | null>(null);
  const [imageName, setImageName] = useState('Scoring table image');
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const setPDFDraft = useTableScoreStore((state) => state.setPDFDraft);

  async function processImage(source: 'camera' | 'library') {
    setError(null);
    try {
      if (source === 'camera') {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) throw new Error('Camera permission is required to take a photo.');
      }
      const picked = source === 'camera'
        ? await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 1 })
        : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 1 });
      if (picked.canceled || !picked.assets[0]) return;
      const image = picked.assets[0];
      setText('');
      setImageURI(image.uri);
      setImageName(image.fileName ?? 'Scoring table image');
      setLoading(true);
      const recognized = await readImageText(image.uri);
      setText(recognized);
      if (!recognized) setError('No text was found. Try a sharper photo with the whole points table visible.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not read this image.');
    } finally {
      setLoading(false);
    }
  }

  function buildSheet() {
    if (!gameName.trim() || !text.trim()) return;
    const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    const scoringExcerpts = lines.filter((line) => /\b(vp|pv|points?|victory|score|puntos?|victoria)\b/i.test(line)).slice(0, 12);
    setPDFDraft({ fileName: imageName, pages: 1, text: text.trim(), scoringExcerpts: scoringExcerpts.length ? scoringExcerpts : lines.slice(0, 12) });
    router.push({ pathname: '/rules/new', params: { fromImage: '1', game: gameName.trim(), ...(gameId ? { gameId } : {}) } });
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.topRow}><IconButton icon="arrow-left" iconColor={colors.forest} onPress={() => router.back()} /><Text style={styles.topLabel}>POINTS TABLE READER</Text><View style={styles.topSpacer} /></View>
        <Text style={styles.title}>Read points from an image</Text>
        <Text style={styles.copy}>Choose a screenshot or photograph a victory-point table. Review the recognized text before creating a scoring sheet.</Text>
        <TextInput label="Game name" value={gameName} onChangeText={setGameName} mode="outlined" />
        <Button mode="contained" icon="image" disabled={loading} onPress={() => processImage('library')}>Choose image</Button>
        <Button mode="outlined" icon="camera" disabled={loading} onPress={() => processImage('camera')}>Take photo</Button>
        {imageURI && <Image source={{ uri: imageURI }} style={styles.preview} resizeMode="contain" />}
        {loading && <Text style={styles.copy}>Reading text on this device…</Text>}
        {error && <Text style={styles.error}>{error}</Text>}
        {!!text && <>
          <Text style={styles.sectionTitle}>Recognized text</Text>
          <TextInput label="Correct any OCR mistakes" value={text} onChangeText={setText} mode="outlined" multiline numberOfLines={10} />
          <Text style={styles.copy}>The image is not uploaded. You choose the fields and point values in the next step.</Text>
          <Button mode="contained" icon="table-edit" disabled={!gameName.trim() || !text.trim()} onPress={buildSheet}>Build scoring sheet</Button>
        </>}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.canvas },
  content: { gap: 13, padding: 20, paddingBottom: 42 },
  topRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginLeft: -12 },
  topLabel: { color: colors.orangeInk, fontSize: 10, fontWeight: '800', letterSpacing: 1.4 },
  topSpacer: { width: 40 },
  title: { color: colors.ink, fontSize: 30, fontWeight: '800' },
  copy: { color: colors.muted, fontSize: 14, lineHeight: 21 },
  sectionTitle: { color: colors.ink, fontSize: 19, fontWeight: '800' },
  preview: { backgroundColor: colors.paper, borderRadius: 18, height: 240, width: '100%' },
  error: { color: colors.error },
});
