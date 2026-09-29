import { useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { ScoreTextField as TextInput } from '@decodadev02/scoreui';
import { ActivityIndicator, IconButton, SegmentedButtons, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

import { api, type Rulebook } from '@/lib/api';
import { useTableScoreStore } from '@/stores/useTableScoreStore';
import { AppButton as Button } from '@/components/AppButton';
import { colors } from '@/theme';

export default function RulebookCatalogScreen() {
  const [query, setQuery] = useState('');
  const [language, setLanguage] = useState<'en' | 'fr'>('en');
  const [books, setBooks] = useState<Rulebook[]>([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cached, setCached] = useState(false);
  const [searched, setSearched] = useState(false);
  const latestRequest = useRef(0);
  const mounted = useRef(false);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  const setPDFDraft = useTableScoreStore((state) => state.setPDFDraft);

  useEffect(() => {
    const request = ++latestRequest.current;
    let active = true;
    api.searchRulebooks('', language).then((result) => {
      if (active && request === latestRequest.current) { setBooks(result.results); setCached(result.cached); }
    }).catch((cause) => {
      if (active && request === latestRequest.current) setError(cause instanceof Error ? cause.message : 'No pudimos cargar el catálogo.');
    }).finally(() => { if (active && request === latestRequest.current) setLoading(false); });
    return () => { active = false; };
  }, [language]);

  async function search() {
    const request = ++latestRequest.current;
    setLoading(true); setError(null); setSearched(true);
    try {
      const result = await api.searchRulebooks(query, language);
      if (mounted.current && request === latestRequest.current) { setBooks(result.results); setCached(result.cached); }
    } catch (cause) {
      if (mounted.current && request === latestRequest.current) { setBooks([]); setError(cause instanceof Error ? cause.message : 'No pudimos buscar reglamentos.'); }
    } finally { if (mounted.current && request === latestRequest.current) setLoading(false); }
  }

  async function importBook(book: Rulebook) {
    setImporting(book.id); setError(null);
    try {
      const document = await api.extractRulebook(book.id);
      if (!mounted.current) return;
      setPDFDraft(document);
      const game = document.scoringSuggestion?.gameName || book.name.replace(/\s+Rulebook$/i, '');
      router.push({ pathname: '/pdf/reader', params: { rulebookId: book.id, game } });
    } catch (cause) { if (mounted.current) setError(cause instanceof Error ? cause.message : 'No pudimos importar el reglamento.'); }
    finally { if (mounted.current) setImporting(null); }
  }

  return <SafeAreaView style={styles.safe} edges={['top']}>
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <View style={styles.top}><IconButton icon="arrow-left" onPress={() => router.back()} /><Text style={styles.label}>REGLAMENTOS</Text></View>
      <Text style={styles.title}>Enseñale un juego a MeppVP.</Text>
      <Text style={styles.copy}>Buscá el reglamento, elegí la edición correcta y revisá la propuesta de puntuación antes de guardar.</Text>
      <TextInput label="Nombre del juego" value={query} onChangeText={(value) => setQuery(Array.from(value).slice(0, 100).join(''))} mode="outlined" returnKeyType="search" onSubmitEditing={() => { if (!loading && !importing) void search(); }} />
      <SegmentedButtons value={language} onValueChange={(value) => { setLanguage(value); setLoading(true); setError(null); setSearched(false); setBooks([]); }} buttons={[{ value: 'en', label: 'Inglés', disabled: !!importing }, { value: 'fr', label: 'Francés', disabled: !!importing }]} />
      <Button mode="contained" icon="magnify" loading={loading} disabled={loading || !!importing} onPress={search}>Buscar reglamentos</Button>
      {error && <Text style={styles.error}>{error}</Text>}
      {importing && <View style={styles.card}><ActivityIndicator /><Text style={styles.copy}>Leyendo el reglamento… Los PDF escaneados pueden tardar más.</Text></View>}
      {cached && <Text style={styles.copy}>El catálogo externo no responde. Mostramos los reglamentos que ya tenemos guardados.</Text>}
      {!searched && <Text style={styles.label}>DISPONIBLES EN EL CATÁLOGO</Text>}
      {!loading && searched && books.length === 0 && !error && <Text style={styles.copy}>No encontramos reglamentos en ese idioma. Probá otro nombre o importá tu PDF desde la biblioteca.</Text>}
      {books.map((book) => <View style={styles.card} key={book.id}>
        <Text style={styles.bookTitle}>{book.name}</Text>
        <Text style={styles.copy}>{book.language.toUpperCase()}{book.edition ? ` · ${book.edition}` : ''} · {book.source}</Text>
        <Text style={styles.copy}>Confirmá que sea el juego base o la expansión que vas a jugar.</Text>
        <Button mode="outlined" icon="file-pdf-box" loading={importing === book.id} disabled={!!importing || loading} onPress={() => importBook(book)}>Leer y crear planilla</Button>
      </View>)}
      <Text style={styles.copy}>Catan y Everdell base tienen propuestas revisadas. Otros reglamentos permiten detectar tablas o configurar los campos manualmente usando el texto extraído.</Text>
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
