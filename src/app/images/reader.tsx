import { useState } from 'react';
import { Image, ScrollView, StyleSheet, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { IconButton, Text, TextInput } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton as Button } from '@/components/AppButton';
import { api, type PDFExtract } from '@/lib/api';
import { readImageText } from '@/lib/imageOCR';
import { useTableScoreStore } from '@/stores/useTableScoreStore';
import { colors } from '@/theme';

export default function ImageReaderScreen() {
  const { game, gameId } = useLocalSearchParams<{ game?: string; gameId?: string }>();
  const [gameName, setGameName] = useState(game ?? '');
  const [imageURI, setImageURI] = useState<string | null>(null);
  const [imageName, setImageName] = useState('Imagen de tabla de puntos');
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const setPDFDraft = useTableScoreStore((state) => state.setPDFDraft);

  async function processImage(source: 'camera' | 'library') {
    setError(null);
    try {
      if (source === 'camera') {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) throw new Error('Necesitamos permiso para usar la cámara.');
      }
      const picked = source === 'camera'
        ? await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 1 })
        : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 1 });
      if (picked.canceled || !picked.assets[0]) return;
      const image = picked.assets[0];
      setText('');
      setImageURI(image.uri);
      setImageName(image.fileName ?? 'Imagen de tabla de puntos');
      setLoading(true);
      const recognized = await readImageText(image.uri);
      setText(recognized);
      if (!recognized) setError('No encontramos texto. Probá con una foto más nítida de toda la tabla.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No pudimos leer la imagen.');
    } finally {
      setLoading(false);
    }
  }

  async function buildSheet() {
    if (!gameName.trim() || !text.trim()) return;
    setLoading(true);
    setError(null);
    const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    const scoringExcerpts = lines.filter((line) => /\b(vp|pv|points?|victory|score|puntos?|victoria)\b/i.test(line)).slice(0, 12);
    let draft: PDFExtract = { fileName: imageName, pages: 1, text: text.trim(), scoringExcerpts: scoringExcerpts.length ? scoringExcerpts : lines.slice(0, 12) };
    try {
      const interpreted = await api.interpretScoringText(gameName.trim(), text.trim());
      draft = { ...interpreted, fileName: imageName };
    } catch {
      // The locally recognized text still supports manual sheet creation offline.
    }
    setPDFDraft(draft);
    setLoading(false);
    router.push({ pathname: '/rules/new', params: { fromImage: '1', game: gameName.trim(), ...(gameId ? { gameId } : {}) } });
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.topRow}><IconButton icon="arrow-left" iconColor={colors.forest} onPress={() => router.back()} /><Text style={styles.topLabel}>LECTOR DE PUNTOS</Text><View style={styles.topSpacer} /></View>
        <Text style={styles.title}>Leer puntos de una imagen</Text>
        <Text style={styles.copy}>Elegí una captura o fotografiá una tabla de puntos de victoria. Revisá el texto antes de crear la planilla.</Text>
        <TextInput label="Nombre del juego" value={gameName} onChangeText={setGameName} mode="outlined" />
        <Button mode="contained" icon="image" disabled={loading} onPress={() => processImage('library')}>Elegir imagen</Button>
        <Button mode="outlined" icon="camera" disabled={loading} onPress={() => processImage('camera')}>Tomar foto</Button>
        {imageURI && <Image source={{ uri: imageURI }} style={styles.preview} resizeMode="contain" />}
        {loading && <Text style={styles.copy}>Leyendo el texto y preparando la planilla…</Text>}
        {error && <Text style={styles.error}>{error}</Text>}
        {!!text && <>
          <Text style={styles.sectionTitle}>Texto reconocido</Text>
          <TextInput label="Corregí los errores de lectura" value={text} onChangeText={setText} mode="outlined" multiline numberOfLines={10} />
          <Text style={styles.copy}>La imagen queda en tu dispositivo. Enviamos el texto reconocido para sugerir campos; vas a revisar los puntos antes de guardar.</Text>
          <Button mode="contained" icon="table-edit" loading={loading} disabled={loading || !gameName.trim() || !text.trim()} onPress={() => buildSheet().catch((cause) => { setLoading(false); setError(cause instanceof Error ? cause.message : 'No pudimos crear la planilla.'); })}>Crear planilla</Button>
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
