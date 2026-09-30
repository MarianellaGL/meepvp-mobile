import { useState } from 'react';
import { Image, ScrollView, StyleSheet, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { IconButton, Text, TextInput } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton as Button } from '@/components/AppButton';
import { AssistStatus } from '@/components/AssistStatus';
import { api, type PDFExtract } from '@/lib/api';
import { readImageText } from '@/lib/imageOCR';
import { extractScoringDraft } from '@/lib/scoringDraft';
import { useTableScoreStore } from '@/stores/useTableScoreStore';
import { colors } from '@/theme';

export default function ImageReaderScreen() {
  const { game, gameId } = useLocalSearchParams<{ game?: string; gameId?: string }>();
  const [gameName, setGameName] = useState(game ?? '');
  const [imageURI, setImageURI] = useState<string | null>(null);
  const [imageName, setImageName] = useState('Imagen de tabla de puntos');
  const [text, setText] = useState('');
  const [phase, setPhase] = useState<'reading' | 'suggesting' | null>(null);
  const [preparedDraft, setPreparedDraft] = useState<PDFExtract | null>(null);
  const [usedManualFallback, setUsedManualFallback] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const setPDFDraft = useTableScoreStore((state) => state.setPDFDraft);
  const suggestedFields = preparedDraft ? extractScoringDraft(preparedDraft)?.fields ?? [] : [];

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
      setPreparedDraft(null);
      setUsedManualFallback(false);
      setImageURI(image.uri);
      setImageName(image.fileName ?? 'Imagen de tabla de puntos');
      setPhase('reading');
      const recognized = await readImageText(image.uri);
      setText(recognized);
      if (!recognized) setError('No encontramos texto. Probá con una foto más nítida de toda la tabla.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No pudimos leer la imagen.');
    } finally {
      setPhase(null);
    }
  }

  async function prepareSheet() {
    if (!gameName.trim() || !text.trim()) return;
    setPhase('suggesting');
    setError(null);
    setPreparedDraft(null);
    setUsedManualFallback(false);
    const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    const scoringExcerpts = lines.filter((line) => /\b(vp|pv|points?|victory|score|puntos?|victoria)\b/i.test(line)).slice(0, 12);
    let draft: PDFExtract = { fileName: imageName, pages: 1, text: text.trim(), scoringExcerpts: scoringExcerpts.length ? scoringExcerpts : lines.slice(0, 12) };
    try {
      const interpreted = await api.interpretScoringText(gameName.trim(), text.trim());
      draft = { ...interpreted, fileName: imageName };
    } catch {
      setUsedManualFallback(true);
    }
    setPreparedDraft(draft);
    setPhase(null);
  }

  function buildSheet() {
    if (!preparedDraft || !gameName.trim()) return;
    setPDFDraft(preparedDraft);
    router.push({ pathname: '/rules/new', params: { fromImage: '1', game: gameName.trim(), ...(gameId ? { gameId } : {}) } });
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.topRow}><IconButton icon="arrow-left" iconColor={colors.forest} onPress={() => router.back()} /><Text style={styles.topLabel}>LECTOR DE PUNTOS</Text><View style={styles.topSpacer} /></View>
        <Text style={styles.title}>Leer puntos de una imagen</Text>
        <Text style={styles.copy}>Elegí una captura o fotografiá una tabla de puntos de victoria. Revisá el texto antes de crear la planilla.</Text>
        <TextInput label="Nombre del juego" value={gameName} editable={phase === null} onChangeText={(value) => { setGameName(value); setPreparedDraft(null); }} mode="outlined" />
        <Button mode="contained" icon="image" disabled={phase !== null} onPress={() => processImage('library')}>Elegir imagen</Button>
        <Button mode="outlined" icon="camera" disabled={phase !== null} onPress={() => processImage('camera')}>Tomar foto</Button>
        {imageURI && <Image source={{ uri: imageURI }} style={styles.preview} resizeMode="contain" />}
        {phase && <AssistStatus kind="working" title={phase === 'reading' ? 'Leyendo la imagen' : 'Preparando una propuesta'} description={phase === 'reading' ? 'Reconocemos el texto en tu dispositivo.' : 'Buscamos categorías y multiplicadores en el texto corregido.'} />}
        {error && <Text style={styles.error}>{error}</Text>}
        {!!text && <>
          <Text style={styles.sectionTitle}>Texto reconocido</Text>
          <TextInput label="Corregí los errores de lectura" value={text} editable={phase === null} onChangeText={(value) => { setText(value); setPreparedDraft(null); }} mode="outlined" multiline numberOfLines={10} />
          <Text style={styles.copy}>La imagen queda en tu dispositivo. Para sugerir campos enviamos solo el texto corregido.</Text>
          <Button mode="contained" icon="text-box-check-outline" loading={phase === 'suggesting'} disabled={phase !== null || !gameName.trim() || !text.trim()} onPress={() => prepareSheet().catch((cause) => { setPhase(null); setError(cause instanceof Error ? cause.message : 'No pudimos preparar la planilla.'); })}>{preparedDraft ? 'Actualizar propuesta' : 'Preparar propuesta'}</Button>
          {preparedDraft && <>
            <AssistStatus kind={suggestedFields.length ? 'ready' : 'manual'} title={suggestedFields.length ? `${suggestedFields.length} campos para revisar` : 'Planilla manual disponible'} description={suggestedFields.length ? 'Revisá categorías y puntos por unidad antes de guardar.' : usedManualFallback ? 'No pudimos consultar la asistencia. Podés continuar con el texto reconocido.' : 'No encontramos reglas suficientes para proponer campos. Podés armarlos con el texto como referencia.'} />
            {suggestedFields.length > 0 && <View style={styles.suggestionCard}>{suggestedFields.map((field) => <Text key={field.name} style={styles.fieldPreview}>{field.name} · {field.kind === 'manual' ? 'puntaje manual' : `${field.pointsPerUnit} punto${field.pointsPerUnit === 1 ? '' : 's'} ${field.kind === 'checkbox' ? 'por bono' : 'por unidad'}`}</Text>)}</View>}
            <Button mode="contained" icon="table-edit" disabled={phase !== null} onPress={buildSheet}>{suggestedFields.length ? 'Revisar campos de la planilla' : 'Crear planilla manual'}</Button>
          </>}
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
  suggestionCard: { backgroundColor: colors.paper, borderColor: colors.line, borderRadius: 18, borderWidth: 1, gap: 9, padding: 15 },
  fieldPreview: { color: colors.ink, fontSize: 13, lineHeight: 19 },
  error: { color: colors.error },
});
