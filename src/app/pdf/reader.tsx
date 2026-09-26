import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, Button, IconButton, Text, TextInput } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

import { api, type PDFExtract } from '@/lib/api';
import { useTableScoreStore } from '@/stores/useTableScoreStore';
import { colors } from '@/theme';

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
    if (!name) throw new Error('Enter the game name to save this PDF.');
    await savePDF(name, resolvedGameId, pdf);
    setSavedStatus('Saved to your library on this device.');
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
      setError(cause instanceof Error ? cause.message : 'Could not save the PDF.');
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
        setError('No file was selected.');
        return;
      }
      setSelectedFile(asset.name);
      setReplacingDocument(true);
      setDocument(null);
      setSavedStatus(null);
      if (asset.size && asset.size > 20 * 1024 * 1024) {
        setError('Choose a PDF smaller than 20 MB.');
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
        catch { setError('PDF read, but it could not be saved on this device. Try Save PDF again.'); }
      }
    } catch (cause) {
      const reason = cause instanceof Error ? cause.message : 'Unknown error.';
      setError(step === 'select' ? `Could not select the PDF: ${reason}` : `Could not import the PDF: ${reason}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.topRow}><IconButton icon="arrow-left" iconColor={colors.forest} onPress={() => router.back()} /><Text style={styles.topLabel}>RULEBOOK READER</Text><View style={styles.topSpacer} /></View>
        <Text style={styles.title}>Read a rulebook</Text>
        <Text style={styles.subtitle}>Choose a PDF from your device. We&apos;ll show its text and passages that mention scoring.</Text>

        <View style={styles.card}>
          <TextInput label="Game name" value={gameNameDraft} onChangeText={(value) => { setGameNameDraft(value); setSavedStatus(null); }} mode="outlined" />
          <Text style={styles.cardTitle}>{loading ? selectedFile : activeDocument?.fileName ?? selectedFile ?? 'Choose a PDF'}</Text>
          {activeDocument && !loading && <Text style={styles.muted}>{activeDocument.pages} pages</Text>}
          <Button mode="contained" icon="file-pdf-box" loading={loading} disabled={loading || saving} onPress={pickPDF}>{activeDocument ? 'Choose another PDF' : 'Choose PDF'}</Button>
          <Text style={styles.muted}>PDFs with selectable text work best. Scanned pages need OCR, which isn&apos;t available yet.</Text>
        </View>

        {loading && <ActivityIndicator size="large" style={styles.loader} />}
        {error && <View style={styles.errorCard}><Text style={styles.error}>{error}</Text></View>}
        {savedStatus && <Text style={styles.saved}>{savedStatus}</Text>}
        {activeDocument && !loading && (
          <>
            <Text style={styles.heading}>Scoring passages</Text>
            {activeDocument.scoringExcerpts.length ? activeDocument.scoringExcerpts.map((excerpt, index) => (
              <View key={`${index}-${excerpt.slice(0, 12)}`} style={styles.excerpt}><Text style={styles.excerptText}>{excerpt}</Text></View>
            )) : <View style={styles.card}><Text style={styles.muted}>No scoring passages found in the extracted text. You can still read the text below.</Text></View>}
            <Button mode="outlined" icon={showFullText ? 'chevron-up' : 'text-box-search-outline'} onPress={() => setShowFullText((shown) => !shown)}>{showFullText ? 'Hide extracted text' : 'Read extracted text'}</Button>
            {showFullText && <View style={styles.card}><Text selectable style={styles.bodyText}>{activeDocument.text || 'This PDF has no selectable text.'}</Text></View>}
            <Button mode="outlined" icon="content-save-outline" loading={saving} disabled={!name || saving} onPress={() => { setSaving(true); setError(null); saveCurrentPDF(activeDocument).catch((cause) => setError(cause instanceof Error ? cause.message : 'Could not save the PDF.')).finally(() => setSaving(false)); }}>Save PDF to library</Button>
            <Button mode="contained" icon="table-edit" loading={saving} disabled={!name || saving} onPress={saveAndBuild}>Build scoring sheet</Button>
            {!name && <Text style={styles.muted}>Enter the game name to save this PDF or build a scoring sheet.</Text>}
            <Text style={styles.muted}>Review the rulebook before adding fields and point values. The PDF is read for this preview; no scoring sheet is created automatically.</Text>
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
