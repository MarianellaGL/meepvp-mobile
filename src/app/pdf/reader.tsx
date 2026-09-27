import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { ScoreTextField as TextInput } from '@decodadev02/scoreui';
import { ActivityIndicator, IconButton, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

import { api, type PDFExtract } from '@/lib/api';
import { useTableScoreStore } from '@/stores/useTableScoreStore';
import { colors } from '@/theme';
import { AppButton as Button } from '@/components/AppButton';

export default function PDFReaderScreen() {
  const { gameId, game } = useLocalSearchParams<{ gameId?: string; game?: string }>();
  const [document, setDocument] = useState<PDFExtract | null>(null);
  const [loading, setLoading] = useState(false);
  const [showFullText, setShowFullText] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [replacingDocument, setReplacingDocument] = useState(false);
  const [gameNameDraft, setGameNameDraft] = useState(game ?? '');
  const [saving, setSaving] = useState(false);
  const [savedStatus, setSavedStatus] = useState<string | null>(null);
  const collection = useTableScoreStore((state) => state.collection);
  const savedPDFs = useTableScoreStore((state) => state.savedPDFs);
  const savePDF = useTableScoreStore((state) => state.savePDF);
  const setPDFDraft = useTableScoreStore((state) => state.setPDFDraft);
  const name = gameNameDraft.trim();
  const matchedGame = collection.find((item) => item.name.toLocaleLowerCase() === name.toLocaleLowerCase());
  const resolvedGameId = Number(gameId) > 0 ? Number(gameId) : matchedGame?.bggId;
  const savedDocument = savedPDFs.find((item) => resolvedGameId ? item.gameId === resolvedGameId : item.gameName.toLocaleLowerCase() === name.toLocaleLowerCase())?.document;
  const activeDocument = document ?? (replacingDocument ? null : savedDocument) ?? null;

  async function saveCurrentPDF(pdf: PDFExtract) {
    if (!name) throw new Error('Ingresá el nombre del juego para guardar este PDF.');
    await savePDF(name, resolvedGameId, pdf);
    setSavedStatus('Guardado en la biblioteca de este dispositivo.');
  }

  async function saveAndBuild() {
    if (!activeDocument || !name) return;
    setSaving(true);
    setError(null);
    try {
      await saveCurrentPDF(activeDocument);
      setPDFDraft(activeDocument);
      router.push({ pathname: '/rules/new', params: { fromPdf: '1', game: name, ...(resolvedGameId ? { gameId: String(resolvedGameId) } : {}) } });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No pudimos guardar el PDF.');
    } finally {
      setSaving(false);
    }
  }

  async function pickPDF() {
    setError(null);
    let step: 'select' | 'upload' = 'select';
    try {
      const picked = await DocumentPicker.getDocumentAsync({ type: 'application/pdf', copyToCacheDirectory: true });
      if (picked.canceled) return;
      const asset = picked.assets[0];
      if (!asset) {
        setError('No seleccionaste ningún archivo.');
        return;
      }
      setSelectedFile(asset.name);
      setReplacingDocument(true);
      setDocument(null);
      setSavedStatus(null);
      if (asset.size && asset.size > 20 * 1024 * 1024) {
        setError('Elegí un PDF de menos de 20 MB.');
        return;
      }
      step = 'upload';
      setLoading(true);
      const result = await api.extractPDF(asset);
      setDocument(result);
      setPDFDraft(result);
      setShowFullText(false);
      if (name) {
        try { await saveCurrentPDF(result); }
        catch { setError('Leímos el PDF, pero no pudimos guardarlo en este dispositivo.'); }
      }
    } catch (cause) {
      const reason = cause instanceof Error ? cause.message : 'Error desconocido.';
      setError(step === 'select' ? `No pudimos seleccionar el PDF: ${reason}` : `No pudimos importar el PDF: ${reason}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.topRow}><IconButton icon="arrow-left" iconColor={colors.forest} onPress={() => router.back()} /><Text style={styles.topLabel}>LECTOR DE REGLAMENTOS</Text><View style={styles.topSpacer} /></View>
        <Text style={styles.title}>Leer un reglamento</Text>
        <Text style={styles.subtitle}>Elegí un PDF. Te mostraremos el texto y los fragmentos que hablan de puntos.</Text>

        <View style={styles.card}>
          <TextInput label="Nombre del juego" value={gameNameDraft} onChangeText={(value) => { setGameNameDraft(value); setSavedStatus(null); }} mode="outlined" />
          <Text style={styles.cardTitle}>{loading ? selectedFile : activeDocument?.fileName ?? selectedFile ?? 'Elegí un PDF'}</Text>
          {activeDocument && !loading && <Text style={styles.muted}>{activeDocument.pages} páginas</Text>}
          <Button mode="contained" icon="file-pdf-box" loading={loading} disabled={loading || saving} onPress={pickPDF}>{activeDocument ? 'Elegir otro PDF' : 'Elegir PDF'}</Button>
          <Text style={styles.muted}>Funcionan mejor los PDF con texto seleccionable. Las páginas escaneadas todavía necesitan OCR.</Text>
        </View>

        {loading && <ActivityIndicator size="large" style={styles.loader} />}
        {error && <View style={styles.errorCard}><Text style={styles.error}>{error}</Text></View>}
        {savedStatus && <Text style={styles.saved}>{savedStatus}</Text>}
        {activeDocument && !loading && (
          <>
            <Text style={styles.heading}>Fragmentos sobre puntuación</Text>
            {activeDocument.scoringExcerpts.length ? activeDocument.scoringExcerpts.map((excerpt, index) => (
              <View key={`${index}-${excerpt.slice(0, 12)}`} style={styles.excerpt}><Text style={styles.excerptText}>{excerpt}</Text></View>
            )) : <View style={styles.card}><Text style={styles.muted}>No encontramos fragmentos sobre puntos. Podés leer el texto completo abajo.</Text></View>}
            <Button mode="outlined" icon={showFullText ? 'chevron-up' : 'text-box-search-outline'} onPress={() => setShowFullText((shown) => !shown)}>{showFullText ? 'Ocultar texto' : 'Leer texto extraído'}</Button>
            {showFullText && <View style={styles.card}><Text selectable style={styles.bodyText}>{activeDocument.text || 'Este PDF no tiene texto seleccionable.'}</Text></View>}
            <Button mode="outlined" icon="content-save-outline" loading={saving} disabled={!name || saving} onPress={() => { setSaving(true); setError(null); saveCurrentPDF(activeDocument).catch((cause) => setError(cause instanceof Error ? cause.message : 'No pudimos guardar el PDF.')).finally(() => setSaving(false)); }}>Guardar PDF en biblioteca</Button>
            <Button mode="contained" icon="table-edit" loading={saving} disabled={!name || saving} onPress={saveAndBuild}>Crear planilla</Button>
            {!name && <Text style={styles.muted}>Ingresá el nombre del juego para guardar el PDF o crear una planilla.</Text>}
            <Text style={styles.muted}>Revisá el reglamento antes de agregar campos y puntos. Ninguna planilla se crea automáticamente.</Text>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.canvas },
  content: { gap: 14, padding: 20, paddingBottom: 45 },
  topRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginLeft: -12 },
  topLabel: { color: colors.orangeInk, fontSize: 10, fontWeight: '800', letterSpacing: 1.4 },
  topSpacer: { width: 40 },
  title: { color: colors.ink, fontSize: 32, fontWeight: '800' },
  subtitle: { color: colors.muted, fontSize: 15, lineHeight: 21 },
  card: { backgroundColor: colors.paper, borderColor: colors.line, borderRadius: 20, borderWidth: 1, gap: 12, padding: 17 },
  cardTitle: { color: colors.ink, fontSize: 16, fontWeight: '800' },
  muted: { color: colors.muted, fontSize: 13, lineHeight: 19 },
  loader: { marginTop: 12 },
  errorCard: { backgroundColor: colors.orangePale, borderRadius: 15, padding: 14 },
  error: { color: colors.error },
  saved: { color: colors.forest, fontSize: 13, fontWeight: '700' },
  heading: { color: colors.ink, fontSize: 21, fontWeight: '800', marginTop: 12 },
  excerpt: { backgroundColor: colors.mint, borderRadius: 15, padding: 14 },
  excerptText: { color: colors.ink, fontSize: 14, lineHeight: 21 },
  bodyText: { color: colors.ink, fontSize: 13, lineHeight: 20 },
});
