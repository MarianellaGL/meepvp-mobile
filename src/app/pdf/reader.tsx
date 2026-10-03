import { useState } from 'react';
import * as DocumentPicker from 'expo-document-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { useMutation } from '@tanstack/react-query';
import { MeepleImportProcessing, ScoreButton, ScoreTextField } from '@decodadev02/meepleui';

import { openSheetEditor } from '@/features/sheets/openSheetEditor';
import { api } from '@/lib/api';
import { Hint } from '@/shared/ui/Section';
import { Screen } from '@/shared/ui/Screen';

const maxUploadBytes = 20 * 1024 * 1024;

/** Reads an uploaded rulebook and hands it to the sheet editor. */
export default function PDFUploadScreen() {
  const { gameId, game, flow } = useLocalSearchParams<{ gameId?: string; game?: string; flow?: string }>();
  const [gameName, setGameName] = useState(game ?? '');
  const [pickError, setPickError] = useState<string | null>(null);
  const read = useMutation({
    mutationFn: (asset: DocumentPicker.DocumentPickerAsset) => api.extractPDF(asset, gameName.trim()),
    onSuccess: (document) => openSheetEditor(document, { game: gameName, gameId, flow, replace: true }),
  });

  async function pickPDF() {
    setPickError(null);
    const picked = await DocumentPicker.getDocumentAsync({ type: 'application/pdf', copyToCacheDirectory: true }).catch(() => null);
    if (!picked || picked.canceled) return;
    const asset = picked.assets[0];
    if (!asset) return;
    if (asset.size && asset.size > maxUploadBytes) {
      setPickError('Elegí un PDF de hasta 20 MB.');
      return;
    }
    read.mutate(asset);
  }

  return <Screen eyebrow={flow === 'setup' ? 'PARTIDA · PLANILLA' : 'CREAR PLANILLA'} title="Subí el reglamento" subtitle="Leemos el PDF y te mostramos la planilla para que la revises." onBack={() => router.back()}
    footer={!read.isPending && <ScoreButton label={read.error || pickError ? 'Elegir otro PDF' : 'Elegir PDF'} icon="file-pdf-box" onPress={() => void pickPDF()} />}
  >
    {!game && <ScoreTextField label="Juego" placeholder="Everdell, Catan…" value={gameName} onChangeText={setGameName} helperText="Nos ayuda a reconocer la tabla de puntos." />}
    {read.isPending ? <MeepleImportProcessing source="pdf" /> : <Hint>Hasta 20 MB. El PDF no se guarda: usamos su texto para armar la planilla.</Hint>}
    {pickError && <Hint tone="error">{pickError}</Hint>}
    {read.error && <Hint tone="error">No pudimos leer el PDF: {read.error.message}</Hint>}
  </Screen>;
}
