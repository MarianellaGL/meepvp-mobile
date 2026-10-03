import { useState } from 'react';
import { ActivityIndicator } from 'react-native';
import { MeepleLibraryEntry, ScoreButton, ScoreTextField } from '@decodadev02/meepleui';
import { Redirect, router } from 'expo-router';

import { Hint, Section } from '@/shared/ui/Section';
import { Screen } from '@/shared/ui/Screen';
import { useAuthStore } from '@/stores/useAuthStore';
import { useEntryStore } from '@/stores/useEntryStore';
import { useTableScoreStore } from '@/stores/useTableScoreStore';
import { tokens } from '@/theme';

const recentLimit = 3;

export default function HomeScreen() {
  const authReady = useAuthStore((state) => state.hasRestored);
  const user = useAuthStore((state) => state.user);
  const entered = useEntryStore((state) => state.entered);
  const rules = useTableScoreStore((state) => state.rules);
  const session = useTableScoreStore((state) => state.session);
  const [query, setQuery] = useState('');
  const current = session && session.status !== 'finished' ? session : null;
  const currentGame = current ? rules.find((rule) => rule.id === current.ruleId)?.gameName ?? 'Partida' : null;

  function search() {
    if (query.trim().length >= 2) router.push({ pathname: '/games', params: { query: query.trim() } });
  }

  if (!authReady) return <ActivityIndicator color={tokens.color.gold} style={{ flex: 1, backgroundColor: tokens.color.canvas }} />;
  if (!user && !entered) return <Redirect href="/welcome" />;

  return <Screen title="MeepVP" subtitle="Reglas y planillas para cualquier juego de mesa."
    footer={<>
      <ScoreButton label="Crear planilla" icon="plus" onPress={() => router.push('/rules/new')} />
      <ScoreButton label="Unirse a una partida" variant="tertiary" icon="qrcode-scan" onPress={() => router.push('/join')} />
    </>}
  >
    <ScoreTextField label="Buscá un juego o una regla" placeholder="Everdell, Catan…" value={query} onChangeText={setQuery} returnKeyType="search" onSubmitEditing={search} />

    {current && <Section label={current.status === 'paused' ? 'PARTIDA PAUSADA' : 'PARTIDA EN CURSO'}>
      <MeepleLibraryEntry title={currentGame!} detail={`Mesa ${current.tableCode} · Volver a la partida`} onPress={() => router.push(`/sessions/${current.id}`)} />
    </Section>}

    <Section label="TUS PLANILLAS">
      {rules.length ? rules.slice(0, recentLimit).map((rule) => (
        <MeepleLibraryEntry key={rule.id} title={rule.gameName} detail={`${rule.name} · ${rule.fields.length} categorías · Jugar`} onPress={() => router.push({ pathname: '/sessions/new', params: { ruleId: rule.id } })} />
      )) : <Hint>Todavía no tenés planillas. Buscá un juego o creá la primera.</Hint>}
      {rules.length > recentLimit && <MeepleLibraryEntry title="Ver todas" detail={`${rules.length} planillas en tu biblioteca`} onPress={() => router.navigate('/library')} />}
    </Section>
  </Screen>;
}
