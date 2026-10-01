import { ScrollView, StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { MeepleImportProcessing, ScoreTextField as TextInput } from '@decodadev02/meepleui';
import { IconButton, SegmentedButtons, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

import { type Rulebook } from '@/lib/api';
import { useRulebookCatalog } from '@/hooks/useRulebookCatalog';
import { useTableScoreStore } from '@/stores/useTableScoreStore';
import { AppButton as Button } from '@/components/AppButton';
import { colors } from '@/theme';

export default function RulebookCatalogScreen() {
  const { gameId, game } = useLocalSearchParams<{ gameId?: string; game?: string }>();
  const { query, setQuery, language, changeLanguage, searched, search, catalog, importRulebook } = useRulebookCatalog(game);
  const books = catalog.data?.results ?? [];
  const loading = catalog.isFetching;
  const importing = importRulebook.isPending ? importRulebook.variables?.id : null;
  const error = importRulebook.error ?? catalog.error;
  const setPDFDraft = useTableScoreStore((state) => state.setPDFDraft);

  async function importBook(book: Rulebook) {
    try {
      const document = await importRulebook.mutateAsync(book);
      setPDFDraft(document);
      const selectedGame = game || document.scoringSuggestion?.gameName || book.name.replace(/\s+Rulebook$/i, '');
      router.push({ pathname: '/pdf/reader', params: { rulebookId: book.id, game: selectedGame, ...(gameId ? { gameId } : {}) } });
    } catch { /* Mutation error is displayed below. */ }
  }

  return <SafeAreaView style={styles.safe} edges={['top']}>
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <View style={styles.top}><IconButton icon="arrow-left" onPress={() => router.back()} /><Text style={styles.label}>REGLAMENTOS</Text></View>
      <Text style={styles.title}>Enseñale un juego a MeepVP.</Text>
      <Text style={styles.copy}>Buscá el reglamento, confirmá la edición y revisá la propuesta de puntuación antes de guardar.</Text>
      {game && <Text style={styles.copy}>Buscando reglamentos para {game}. Podés cambiar el nombre si esta edición aparece con otro título.</Text>}
      <TextInput label="Nombre del juego" value={query} onChangeText={(value) => setQuery(Array.from(value).slice(0, 100).join(''))} mode="outlined" returnKeyType="search" onSubmitEditing={() => { if (!loading && !importing) search(); }} />
      <SegmentedButtons value={language} onValueChange={(value) => changeLanguage(value as 'en' | 'fr')} buttons={[{ value: 'en', label: 'Inglés', disabled: !!importing }, { value: 'fr', label: 'Francés', disabled: !!importing }]} />
      <Button mode="contained" icon="magnify" loading={loading} disabled={loading || !!importing} onPress={search}>Buscar reglamentos</Button>
      {error && <Text style={styles.error}>{error.message}</Text>}
      {importing && <MeepleImportProcessing source="pdf" />}
      {catalog.data?.cached && <Text style={styles.copy}>El catálogo externo no responde. Mostramos los reglamentos que ya tenemos guardados.</Text>}
      {!searched && <Text style={styles.label}>DISPONIBLES EN EL CATÁLOGO</Text>}
      {!loading && searched && books.length === 0 && !error && <Text style={styles.copy}>No encontramos reglamentos en ese idioma. Probá otro nombre o subí tu PDF.</Text>}
      {books.map((book) => <View style={styles.card} key={book.id}>
        <Text style={styles.bookTitle}>{book.name}</Text>
        <Text style={styles.copy}>{book.language.toUpperCase()}{book.edition ? ` · ${book.edition}` : ''} · {book.source}</Text>
        <Text style={styles.copy}>Confirmá que sea el juego base o la expansión que vas a jugar.</Text>
        <Button mode="outlined" icon="file-pdf-box" loading={importing === book.id} disabled={!!importing || loading} onPress={() => importBook(book)}>Leer y crear planilla</Button>
      </View>)}
      <Button mode="outlined" icon="file-pdf-box" disabled={!!importing} onPress={() => router.push({ pathname: '/pdf/reader', params: { ...(gameId ? { gameId } : {}), ...(game ? { game } : {}) } })}>Subir mi PDF</Button>
      <Text style={styles.copy}>Catan, Everdell y Wingspan base tienen propuestas revisadas. Otros reglamentos permiten detectar tablas o configurar los campos manualmente usando el texto extraído.</Text>
    </ScrollView>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.canvas },
  content: { padding: 20, paddingBottom: 45, gap: 14 },
  top: { flexDirection: 'row', alignItems: 'center', marginLeft: -12 },
  label: { color: colors.orangeInk, fontSize: 11, fontWeight: '800', letterSpacing: 1.3 },
  title: { color: colors.ink, fontSize: 30, fontWeight: '800' },
  copy: { color: colors.muted, fontSize: 13, lineHeight: 20 },
  card: { backgroundColor: colors.paper, borderColor: colors.line, borderWidth: 1, borderRadius: 20, padding: 17, gap: 12 },
  bookTitle: { color: colors.ink, fontSize: 17, fontWeight: '800' },
  error: { color: colors.error },
});
