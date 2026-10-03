import { useEffect, useState } from 'react';
import { ScoreButton, ScoreTextField } from '@decodadev02/meepleui';

import { Hint, Section } from '@/shared/ui/Section';
import { useTableScoreStore } from '@/stores/useTableScoreStore';

/** Imports the person's BoardGameGeek collection so searches find their games first. */
export function BGGImportSection() {
  const savedUsername = useTableScoreStore((state) => state.username);
  const loading = useTableScoreStore((state) => state.isLoadingCollection);
  const status = useTableScoreStore((state) => state.collectionStatus);
  const error = useTableScoreStore((state) => state.error);
  const count = useTableScoreStore((state) => state.collection.length);
  const [draft, setDraft] = useState<string | null>(null);
  const username = draft ?? savedUsername;
  useEffect(() => () => useTableScoreStore.getState().cancelCollection(), []);

  async function importCollection() {
    if (!username.trim()) return;
    try { await useTableScoreStore.getState().loadCollection(username); } catch { /* The store reports the error. */ }
  }

  return <Section label="TU COLECCIÓN DE BGG">
    <Hint>{count ? `${count} juegos importados.` : 'Traé tus juegos para encontrarlos primero al buscar.'}</Hint>
    <ScoreTextField label="Usuario de BGG" value={username} onChangeText={setDraft} autoCapitalize="none" />
    <ScoreButton label="Importar colección" variant="secondary" icon="download" loading={loading} disabled={!username.trim()} onPress={() => void importCollection()} />
    {loading && <ScoreButton label="Cancelar espera" variant="tertiary" onPress={() => useTableScoreStore.getState().cancelCollection()} />}
    {status && <Hint>{status}</Hint>}
    {error && <Hint tone="error">{error}</Hint>}
  </Section>;
}
