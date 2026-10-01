import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { MeepleDisclosure, ScoreTextField as TextInput } from '@decodadev02/meepleui';
import { ActivityIndicator, IconButton, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useCommunityRules } from '@/hooks/useCommunityRules';
import { colors } from '@/theme';
import { AppButton as Button } from '@/components/AppButton';

export default function CommunityRulesScreen() {
  const { game, gameId, planId } = useLocalSearchParams<{ game?: string; gameId?: string; planId?: string }>();
  const bggId = Number(gameId) > 0 ? Number(gameId) : undefined;
  const { query, setQuery, search, results, attachToPlan } = useCommunityRules(game, bggId);
  const rules = results.data ?? [];
  const loading = results.isFetching;
  const error = attachToPlan.error ?? results.error;
  const [showSearch, setShowSearch] = useState(!game);

  async function handleUseRule(ruleId: string) {
    if (!planId) {
      router.push({ pathname: '/sessions/new', params: { ruleId } });
      return;
    }
    try {
      await attachToPlan.mutateAsync({ planId, ruleId });
      router.replace('/schedule');
    } catch { /* Mutation error is displayed below. */ }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.topRow}><IconButton icon="arrow-left" iconColor={colors.forest} onPress={() => router.back()} /><Text style={styles.topLabel}>COMUNIDAD</Text><View style={styles.topSpacer} /></View>
        <Text style={styles.title}>{game ? `Planillas para ${game}` : 'Planillas de la comunidad'}</Text>
        <Text style={styles.subtitle}>{game ? 'Elegí una planilla compartida para jugar.' : 'Buscá un juego para ver las planillas compartidas.'}</Text>
        {game && <MeepleDisclosure title="Cambiar búsqueda" expanded={showSearch} onPress={() => setShowSearch((shown) => !shown)} />}
        {showSearch && <View style={styles.searchCard}>
          <TextInput label="Buscar por juego o planilla" placeholder="Wingspan, Azul…" value={query} onChangeText={setQuery} onSubmitEditing={search} returnKeyType="search" mode="outlined" />
          <Button mode="contained" icon="magnify" loading={loading} disabled={loading} onPress={search}>Buscar planillas</Button>
        </View>}

        {loading ? <ActivityIndicator size="large" style={styles.loader} /> : error ? (
          <View style={styles.card}><Text style={styles.error}>{error.message}</Text><Button mode="outlined" onPress={search}>Reintentar</Button></View>
        ) : rules.length ? (
          <>
            <Text style={styles.count}>{rules.length} {rules.length === 1 ? 'planilla compartida' : 'planillas compartidas'}</Text>
            {rules.map((rule) => (
              <View key={rule.id} style={styles.card}>
                <Text style={styles.gameName}>{rule.gameName}</Text>
                <Text style={styles.sheetName}>{rule.name}</Text>
                <Text style={styles.muted}>{rule.winCondition === 'lowest_total' ? 'Gana el puntaje más bajo' : 'Gana el puntaje más alto'}</Text>
                <View style={styles.fields}>
                  {rule.fields.map((field) => (
                    <View key={field.id} style={styles.fieldRow}>
                      <Text style={styles.fieldName}>{field.name}</Text>
                      <Text style={styles.fieldPoints}>{field.kind === 'manual' ? 'Puntos manuales' : `${field.pointsPerUnit > 0 ? '+' : ''}${field.pointsPerUnit} por ${field.kind === 'checkbox' ? 'marca' : 'unidad'}`}</Text>
                    </View>
                  ))}
                </View>
                <Button mode="contained" icon={planId ? 'check' : 'play'} onPress={() => handleUseRule(rule.id)}>{planId ? 'Agregar a la partida programada' : 'Usar esta planilla'}</Button>
              </View>
            ))}
          </>
        ) : (
          <View style={styles.card}>
            <Text style={styles.sheetName}>No encontramos planillas compartidas</Text>
            <Text style={styles.muted}>Probá con otro juego o creá una planilla y compartila con la comunidad.</Text>
            <Button mode="outlined" icon="plus" onPress={() => router.push({ pathname: '/rules/new', params: { ...(game ? { game } : {}), ...(gameId ? { gameId } : {}), ...(planId ? { planId } : {}) } })}>Crear una planilla</Button>
          </View>
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
  title: { color: colors.ink, fontSize: 31, fontWeight: '800' },
  subtitle: { color: colors.muted, fontSize: 14, lineHeight: 21 },
  searchCard: { backgroundColor: colors.paper, borderColor: colors.line, borderRadius: 20, borderWidth: 1, gap: 12, padding: 16 },
  loader: { marginTop: 30 },
  count: { color: colors.muted, fontSize: 12, fontWeight: '700' },
  card: { backgroundColor: colors.paper, borderColor: colors.line, borderRadius: 20, borderWidth: 1, gap: 10, padding: 17 },
  gameName: { color: colors.orangeInk, fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  sheetName: { color: colors.ink, fontSize: 18, fontWeight: '800' },
  muted: { color: colors.muted, fontSize: 13, lineHeight: 19 },
  fields: { gap: 7, marginVertical: 4 },
  fieldRow: { alignItems: 'center', backgroundColor: colors.canvas, borderRadius: 10, flexDirection: 'row', gap: 8, justifyContent: 'space-between', padding: 10 },
  fieldName: { color: colors.ink, flex: 1, fontSize: 13, fontWeight: '700' },
  fieldPoints: { color: colors.forest, fontSize: 12, fontWeight: '700' },
  error: { color: colors.error },
});
