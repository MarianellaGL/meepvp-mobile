import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { MeepleDisclosure, MeepleImportProcessing, MeepleScoringPreview, ScoreTextField as TextInput } from '@decodadev02/meepleui';
import { IconButton, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

import { usePDFReader } from '@/hooks/usePDFReader';
import { colors, tokens } from '@/theme';
import { AppButton as Button } from '@/components/AppButton';
import { AssistStatus } from '@/components/AssistStatus';

export default function PDFReaderScreen() {
  const { gameId, game, rulebookId, flow } = useLocalSearchParams<{ gameId?: string; game?: string; rulebookId?: string; flow?: string }>();
  const reader = usePDFReader({ gameId, game, rulebookId, flow });
  const { activeDocument, savedDocument, savedItem, scoringTable, scoringDraft,
    scoringNotes, setScoringNotes, canSuggest, gameNameDraft, changeGameName, name, selectedFile, retryAsset, savedStatus, error,
    loading, saving, suggesting, pickPDF, importAsset, saveCurrent, saveAndBuild, suggestWithAI } = reader;
  const [showFullText, setShowFullText] = useState(false);
  const [showMoreOptions, setShowMoreOptions] = useState(false);
  const [showNotes, setShowNotes] = useState(false);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.topRow}><IconButton icon="arrow-left" iconColor={colors.forest} onPress={() => router.back()} /><Text style={styles.topLabel}>{flow === 'setup' ? 'PARTIDA · PLANILLA' : 'TU BIBLIOTECA'}</Text><View style={styles.topSpacer} /></View>
        <Text style={styles.title}>{loading ? 'Leyendo PDF' : activeDocument ? scoringDraft ? 'Leemos el PDF' : 'Sin tabla detectada' : error ? 'No pudimos leerlo' : 'Elegí un PDF'}</Text>
        <Text style={styles.subtitle}>{loading ? 'Estamos extrayendo las reglas y buscando cómo contar los puntos.' : activeDocument ? scoringDraft ? 'Encontramos una estructura de puntos. Revisala antes de guardar la planilla.' : 'No encontramos una estructura de puntos confiable. Revisá los fragmentos o pedí una propuesta editable.' : 'Subí el reglamento para buscar las reglas de puntuación.'}</Text>
        {flow === 'setup' && <View accessibilityLabel="Paso 4 de 5" style={styles.progressTrack}><View style={styles.progressFill} /></View>}
        {activeDocument?.rulebook && <Text style={styles.muted}>Fuente: {activeDocument.rulebook.source} · {activeDocument.rulebook.language.toUpperCase()} · {activeDocument.rulebook.name}</Text>}

        <View style={styles.card}>
          <TextInput label="Nombre del juego" value={gameNameDraft} onChangeText={changeGameName} mode="outlined" />
          <Text style={styles.cardTitle}>{loading ? selectedFile : activeDocument?.fileName ?? selectedFile ?? 'Elegí un PDF'}</Text>
          {activeDocument && !loading && <Text style={styles.muted}>{activeDocument.pages} páginas</Text>}
          {!activeDocument && !loading && <Text style={styles.muted}>Podés elegir un PDF de hasta 20 MB. Antes de guardar una planilla vas a revisar los campos.</Text>}
        </View>

        {loading && <MeepleImportProcessing source="pdf" />}
        {error && <View style={styles.errorCard}><Text style={styles.error}>{error}</Text></View>}
        {retryAsset && !loading && <Button mode="outlined" icon="refresh" onPress={() => importAsset(retryAsset).catch(() => undefined)}>Reintentar con {retryAsset.name}</Button>}
        {savedStatus && <Text style={styles.saved}>{savedStatus}</Text>}
        {activeDocument && !loading && (
          <>
            <AssistStatus
              kind={scoringDraft ? 'ready' : 'manual'}
              title={activeDocument.scoringSuggestion?.source === 'ai' ? 'Propuesta asistida por IA' : activeDocument.scoringSuggestion ? 'Planilla sugerida desde el reglamento' : scoringDraft ? 'Tabla de puntos detectada' : 'Texto listo para revisión'}
              description={scoringDraft ? `${scoringDraft.fields.length} campos detectados. Vas a poder corregir nombres, tipos y puntos antes de guardar.` : 'No encontramos una estructura de puntos confiable. Podés pedir una propuesta con IA a partir del texto o crear la planilla manualmente.'}
            />
            {activeDocument.scoringSuggestion && scoringDraft ? <MeepleScoringPreview gameName={scoringDraft.gameName || name} fields={scoringDraft.fields} notes={scoringDraft.notes} /> : scoringTable ? <>
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
            </> : null}
            {!!scoringDraft && <MeepleDisclosure title="Fragmentos sobre puntuación" detail="Ver o corregir el texto usado" expanded={showNotes} onPress={() => setShowNotes((shown) => !shown)} />}
            {(!scoringDraft || showNotes) && <TextInput
              label="Fragmentos sobre puntuación"
              value={scoringNotes}
              onChangeText={setScoringNotes}
              placeholder={'• Cada moneda vale 1 punto.\n• Cada objetivo cumplido vale 3 puntos.'}
              helperText="Una regla por línea. Los fragmentos conservan el idioma original; la propuesta se presenta en español."
              mode="outlined"
              multiline
              numberOfLines={6}
              style={styles.scoringInput}
            />}
            {!scoringDraft && !canSuggest && <Text style={styles.muted}>{!name ? 'Ingresá el nombre del juego para pedir la propuesta.' : 'Necesitamos texto legible del reglamento para preparar una propuesta.'}</Text>}
            {!scoringDraft && <Pressable accessibilityRole="link" onPress={saveAndBuild} disabled={!name || saving || suggesting}><Text style={[styles.link, (!name || saving || suggesting) && styles.disabledLink]}>Armar la planilla manualmente →</Text></Pressable>}
            {!name && <Text style={styles.muted}>Ingresá el nombre del juego para guardar el texto o crear una planilla.</Text>}
            <MeepleDisclosure title="Más opciones del reglamento" expanded={showMoreOptions} onPress={() => setShowMoreOptions((shown) => !shown)} />
            {showMoreOptions && <View style={styles.card}>
              {scoringDraft && <Button mode="text" icon="auto-fix" loading={suggesting} disabled={!canSuggest || suggesting || saving} onPress={suggestWithAI}>Actualizar propuesta con IA</Button>}
              <Button mode="outlined" icon="file-pdf-box" disabled={loading || saving || suggesting} onPress={pickPDF}>Elegir otro PDF</Button>
              <Button mode="outlined" icon={showFullText ? 'chevron-up' : 'text-box-search-outline'} onPress={() => setShowFullText((shown) => !shown)}>{showFullText ? 'Ocultar texto' : 'Leer texto extraído'}</Button>
              {showFullText && <View>{activeDocument === savedDocument && savedItem?.textTruncated && <Text style={styles.muted}>La copia guardada conserva las primeras 200.000 letras del texto extraído.</Text>}<Text selectable style={styles.bodyText}>{activeDocument.text || 'No pudimos encontrar texto en este PDF.'}</Text></View>}
              <Button mode="outlined" icon="content-save-outline" loading={saving} disabled={!name || saving || suggesting} onPress={saveCurrent}>Guardar texto extraído</Button>
              <Text style={styles.muted}>Se guarda el texto y la propuesta en este dispositivo. El PDF original no se conserva.</Text>
            </View>}
          </>
        )}
      </ScrollView>
      {!loading && <View style={styles.bottomAction}>
        {!activeDocument ? <Button mode="contained" icon="file-pdf-box" disabled={saving} onPress={pickPDF}>{error ? 'Elegir otro PDF' : 'Elegir PDF'}</Button> : scoringDraft ?
          <Button mode="contained" icon="table-edit" loading={saving} disabled={!name || saving || suggesting} onPress={saveAndBuild}>Revisar planilla</Button> :
          <Button mode="contained" icon="auto-fix" loading={suggesting} disabled={!canSuggest || suggesting || saving} onPress={suggestWithAI}>Proponer con IA</Button>}
      </View>}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.canvas },
  content: { gap: 14, padding: 24, paddingBottom: 45 },
  topRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginLeft: -12 },
  topLabel: { color: colors.orangeInk, fontSize: 10, fontWeight: '800', letterSpacing: 1.4 },
  topSpacer: { width: 40 },
  title: { color: colors.ink, fontFamily: tokens.font.heading, fontSize: 27, lineHeight: 35 },
  subtitle: { color: colors.muted, fontSize: 15, lineHeight: 21 },
  card: { backgroundColor: colors.paper, borderColor: colors.line, borderRadius: 20, borderWidth: 1, gap: 12, padding: 17 },
  cardTitle: { color: colors.ink, fontSize: 16, fontWeight: '800' },
  muted: { color: colors.muted, fontSize: 13, lineHeight: 19 },
  loader: { marginTop: 12 },
  errorCard: { backgroundColor: colors.orangePale, borderRadius: 15, padding: 14 },
  error: { color: colors.error },
  saved: { color: colors.forest, fontSize: 13, fontWeight: '700' },
  heading: { color: colors.ink, fontSize: 21, fontWeight: '800', marginTop: 12 },
  scoringInput: { minHeight: 152 },
  bodyText: { color: colors.ink, fontSize: 13, lineHeight: 20 },
  tableScroll: { paddingBottom: 3 },
  table: { backgroundColor: colors.paper, borderColor: colors.line, borderRadius: 15, borderWidth: 1, overflow: 'hidden' },
  tableRow: { flexDirection: 'row', alignItems: 'center', borderBottomColor: colors.line, borderBottomWidth: 1, minHeight: 48 },
  tableHeader: { backgroundColor: colors.forest },
  tableHeaderText: { color: colors.paper, fontWeight: '800' },
  tableCategory: { color: colors.ink, fontSize: 12, fontWeight: '700', padding: 9, width: 210 },
  tableCell: { color: colors.muted, fontSize: 13, textAlign: 'center', width: 46 },
  tableTotal: { backgroundColor: colors.mint, borderBottomWidth: 0 },
  progressTrack: { backgroundColor: colors.line, borderRadius: 4, height: 5, marginTop: 8, overflow: 'hidden' },
  progressFill: { backgroundColor: colors.orangeInk, height: '100%', width: '80%' },
  link: { color: colors.orangeInk, fontSize: 14, fontWeight: '700', marginVertical: 6 },
  disabledLink: { opacity: 0.45 },
  bottomAction: { backgroundColor: colors.canvas, paddingHorizontal: 24, paddingVertical: 12 },
});
