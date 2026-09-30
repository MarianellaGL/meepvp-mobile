import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { ScoreTextField as TextInput } from '@decodadev02/meepleui';
import { ActivityIndicator, IconButton, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

import { api, type PDFExtract } from '@/lib/api';
import { extractScoringTable } from '@/lib/scoringTable';
import { extractScoringDraft } from '@/lib/scoringDraft';
import { useTableScoreStore } from '@/stores/useTableScoreStore';
import { colors } from '@/theme';
import { AppButton as Button } from '@/components/AppButton';

export default function PDFReaderScreen() {
  const { gameId, game, rulebookId } = useLocalSearchParams<{ gameId?: string; game?: string; rulebookId?: string }>();
  const [document, setDocument] = useState<PDFExtract | null>(null);
  const [loading, setLoading] = useState(false);
  const [showFullText, setShowFullText] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [retryAsset, setRetryAsset] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [replacingDocument, setReplacingDocument] = useState(false);
  const [gameNameDraft, setGameNameDraft] = useState(game ?? '');
  const [saving, setSaving] = useState(false);
  const [savedStatus, setSavedStatus] = useState<string | null>(null);
  const collection = useTableScoreStore((state) => state.collection);
  const savedPDFs = useTableScoreStore((state) => state.savedPDFs);
  const savePDF = useTableScoreStore((state) => state.savePDF);
  const setPDFDraft = useTableScoreStore((state) => state.setPDFDraft);
  const pdfDraft = useTableScoreStore((state) => state.pdfDraft);
  const name = gameNameDraft.trim();
  const matchedGame = collection.find((item) => item.name.toLocaleLowerCase() === name.toLocaleLowerCase());
  const resolvedGameId = Number(gameId) > 0 ? Number(gameId) : matchedGame?.bggId;
  const savedItem = savedPDFs.find((item) => resolvedGameId ? item.gameId === resolvedGameId : item.gameName.toLocaleLowerCase() === name.toLocaleLowerCase());
  const savedDocument = savedItem?.document;
  const catalogDocument = rulebookId && pdfDraft?.rulebook?.id === rulebookId ? pdfDraft : null;
  const activeDocument = document ?? (replacingDocument ? null : catalogDocument ?? savedDocument) ?? null;
  const scoringTable = activeDocument ? extractScoringTable(activeDocument) : null;
  const scoringDraft = activeDocument ? extractScoringDraft(activeDocument) : null;

  async function saveCurrentPDF(pdf: PDFExtract) {
    if (!name) throw new Error('Ingresá el nombre del juego para guardar este PDF.');
    await savePDF(name, resolvedGameId, pdf);
    setSavedStatus('Extracción guardada en este dispositivo. El archivo PDF original no se conserva.');
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
      setError(cause instanceof Error ? cause.message : 'No pudimos guardar la extracción.');
    } finally {
      setSaving(false);
    }
  }

  async function importAsset(asset: DocumentPicker.DocumentPickerAsset) {
    setError(null);
    setRetryAsset(asset);
    setSelectedFile(asset.name);
    setReplacingDocument(true);
    setDocument(null);
    setSavedStatus(null);
    if (asset.size && asset.size > 20 * 1024 * 1024) {
      setError('Elegí un PDF de menos de 20 MB.');
      setRetryAsset(null);
      return;
    }
    setLoading(true);
    try {
      const result = await api.extractPDF(asset, name);
      setDocument(result);
      setRetryAsset(null);
      if (!name && result.scoringSuggestion?.gameName) setGameNameDraft(result.scoringSuggestion.gameName);
      setPDFDraft(result);
      setShowFullText(false);
      if (name) {
        try { await saveCurrentPDF(result); }
        catch { setError('Leímos el PDF, pero no pudimos guardar la extracción en este dispositivo.'); }
      }
    } catch (cause) {
      const reason = cause instanceof Error ? cause.message : 'Error desconocido.';
      setError(`No pudimos importar el PDF: ${reason}`);
    } finally {
      setLoading(false);
    }
  }

  async function pickPDF() {
    setError(null);
    try {
      const picked = await DocumentPicker.getDocumentAsync({ type: 'application/pdf', copyToCacheDirectory: true });
      if (picked.canceled) return;
      const asset = picked.assets[0];
      if (!asset) {
        setError('No seleccionaste ningún archivo.');
        return;
      }
      await importAsset(asset);
    } catch (cause) {
      const reason = cause instanceof Error ? cause.message : 'Error desconocido.';
      setError(`No pudimos seleccionar el PDF: ${reason}`);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.topRow}><IconButton icon="arrow-left" iconColor={colors.forest} onPress={() => router.back()} /><Text style={styles.topLabel}>LECTOR DE REGLAMENTOS</Text><View style={styles.topSpacer} /></View>
        <Text style={styles.title}>Leer un reglamento</Text>
        <Text style={styles.subtitle}>Elegí un PDF. Leemos sus reglas de puntos y, cuando hay evidencia suficiente, preparamos una planilla para que la revises.</Text>
        {activeDocument?.rulebook && <Text style={styles.muted}>Fuente: {activeDocument.rulebook.source} · {activeDocument.rulebook.language.toUpperCase()} · {activeDocument.rulebook.name}</Text>}

        <View style={styles.card}>
          <TextInput label="Nombre del juego" value={gameNameDraft} onChangeText={(value) => { setGameNameDraft(value); setSavedStatus(null); }} mode="outlined" />
          <Text style={styles.cardTitle}>{loading ? selectedFile : activeDocument?.fileName ?? selectedFile ?? 'Elegí un PDF'}</Text>
          {activeDocument && !loading && <Text style={styles.muted}>{activeDocument.pages} páginas</Text>}
          <Button mode="contained" icon="file-pdf-box" loading={loading} disabled={loading || saving} onPress={pickPDF}>{activeDocument ? 'Elegir otro PDF' : 'Elegir PDF'}</Button>
          <Text style={styles.muted}>Los PDF escaneados también se leen y pueden tardar un poco más. Si hay asistencia de IA, se envían fragmentos del texto extraído para proponer campos. Al guardar, conservamos el texto y la propuesta, no el archivo original.</Text>
        </View>

        {loading && <View style={styles.loadingCard}><ActivityIndicator size="large" /><Text style={styles.muted}>Subiendo y leyendo {selectedFile ?? 'el PDF'}…</Text></View>}
        {error && <View style={styles.errorCard}><Text style={styles.error}>{error}</Text></View>}
        {retryAsset && !loading && <Button mode="outlined" icon="refresh" onPress={() => importAsset(retryAsset).catch(() => undefined)}>Reintentar con {retryAsset.name}</Button>}
        {savedStatus && <Text style={styles.saved}>{savedStatus}</Text>}
        {activeDocument && !loading && (
          <>
            {activeDocument.scoringSuggestion && scoringDraft ? <View style={styles.card}>
              <Text style={styles.heading}>Propuesta para {scoringDraft.gameName}</Text>
              {activeDocument.scoringSuggestion.source === 'ai' && <Text style={styles.muted}>Propuesta asistida por IA. Confirmá los campos y puntos con el reglamento.</Text>}
              {scoringDraft.fields.map((field) => <Text key={field.name} style={styles.bodyText}>
                {field.name}: {field.kind === 'manual' ? 'puntaje final de la categoría' : `${field.pointsPerUnit} punto${field.pointsPerUnit === 1 ? '' : 's'} ${field.kind === 'checkbox' ? 'si tenés el bono' : 'por unidad'}`}
              </Text>)}
              {scoringDraft.notes.map((note) => <Text key={note} style={styles.muted}>{note}</Text>)}
            </View> : scoringTable ? <>
              <Text style={styles.heading}>Tabla de puntuación</Text>
              <Text style={styles.muted}>{scoringTable.categories.length} categorías detectadas. Podés corregirlas al crear la planilla. Cada jugador cargará sus puntos cuando se una a la partida.</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator contentContainerStyle={styles.tableScroll}>
                <View style={styles.table}>
                  <View style={[styles.tableRow, styles.tableHeader]}>
                    <Text style={[styles.tableCategory, styles.tableHeaderText]}>Categoría</Text>
                    {scoringTable.columns.map((column) => <Text key={column} style={[styles.tableCell, styles.tableHeaderText]}>{column}</Text>)}
                  </View>
                  {scoringTable.categories.map((category) => <View key={category} style={styles.tableRow}>
                    <Text style={styles.tableCategory}>{category}</Text>
                    {scoringTable.columns.map((column) => <Text key={column} style={styles.tableCell}>—</Text>)}
                  </View>)}
                  <View style={[styles.tableRow, styles.tableTotal]}>
                    <Text style={styles.tableCategory}>Puntuación total</Text>
                    {scoringTable.columns.map((column) => <Text key={column} style={styles.tableCell}>—</Text>)}
                  </View>
                </View>
              </ScrollView>
            </> : <>
              <Text style={styles.heading}>Fragmentos sobre puntuación</Text>
              {activeDocument.scoringExcerpts.length ? activeDocument.scoringExcerpts.map((excerpt, index) => (
                <View key={`${index}-${excerpt.slice(0, 12)}`} style={styles.excerpt}><Text style={styles.excerptText}>{excerpt}</Text></View>
              )) : <View style={styles.card}><Text style={styles.muted}>No encontramos fragmentos sobre puntos. Podés leer el texto completo abajo.</Text></View>}
            </>}
            <Button mode="outlined" icon={showFullText ? 'chevron-up' : 'text-box-search-outline'} onPress={() => setShowFullText((shown) => !shown)}>{showFullText ? 'Ocultar texto' : 'Leer texto extraído'}</Button>
            {showFullText && <View style={styles.card}>{activeDocument === savedDocument && savedItem?.textTruncated && <Text style={styles.muted}>La copia guardada conserva las primeras 200.000 letras del texto extraído.</Text>}<Text selectable style={styles.bodyText}>{activeDocument.text || 'No pudimos encontrar texto en este PDF.'}</Text></View>}
            <Button mode="outlined" icon="content-save-outline" loading={saving} disabled={!name || saving} onPress={() => { setSaving(true); setError(null); saveCurrentPDF(activeDocument).catch((cause) => setError(cause instanceof Error ? cause.message : 'No pudimos guardar la extracción.')).finally(() => setSaving(false)); }}>Guardar extracción en biblioteca</Button>
            <Button mode="contained" icon="table-edit" loading={saving} disabled={!name || saving} onPress={saveAndBuild}>Crear planilla</Button>
            {!name && <Text style={styles.muted}>Ingresá el nombre del juego para guardar el PDF o crear una planilla.</Text>}
            <Text style={styles.muted}>{scoringDraft ? 'Los campos se cargarán en la planilla para que los revises antes de empezar una partida.' : 'Revisá el reglamento antes de agregar campos y puntos.'}</Text>
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
  loadingCard: { alignItems: 'center', backgroundColor: colors.paper, borderColor: colors.line, borderRadius: 18, borderWidth: 1, gap: 12, padding: 24 },
  errorCard: { backgroundColor: colors.orangePale, borderRadius: 15, padding: 14 },
  error: { color: colors.error },
  saved: { color: colors.forest, fontSize: 13, fontWeight: '700' },
  heading: { color: colors.ink, fontSize: 21, fontWeight: '800', marginTop: 12 },
  excerpt: { backgroundColor: colors.mint, borderRadius: 15, padding: 14 },
  excerptText: { color: colors.ink, fontSize: 14, lineHeight: 21 },
  bodyText: { color: colors.ink, fontSize: 13, lineHeight: 20 },
  tableScroll: { paddingBottom: 3 },
  table: { backgroundColor: colors.paper, borderColor: colors.line, borderRadius: 15, borderWidth: 1, overflow: 'hidden' },
  tableRow: { flexDirection: 'row', alignItems: 'center', borderBottomColor: colors.line, borderBottomWidth: 1, minHeight: 48 },
  tableHeader: { backgroundColor: colors.forest },
  tableHeaderText: { color: colors.paper, fontWeight: '800' },
  tableCategory: { color: colors.ink, fontSize: 12, fontWeight: '700', padding: 9, width: 210 },
  tableCell: { color: colors.muted, fontSize: 13, textAlign: 'center', width: 46 },
  tableTotal: { backgroundColor: colors.mint, borderBottomWidth: 0 },
});
