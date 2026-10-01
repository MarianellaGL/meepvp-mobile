import { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useMutation } from '@tanstack/react-query';

import { api, type PDFExtract } from '@/lib/api';
import { readImageText } from '@/lib/imageOCR';
import { extractScoringDraft } from '@/lib/scoringDraft';
import { useTableScoreStore } from '@/stores/useTableScoreStore';

export function useImageReader(initialGame = '', gameId?: string) {
  const [gameName, setGameName] = useState(initialGame);
  const [imageURI, setImageURI] = useState<string | null>(null);
  const [imageName, setImageName] = useState('Imagen de tabla de puntos');
  const [text, setText] = useState('');
  const [preparedDraft, setPreparedDraft] = useState<PDFExtract | null>(null);
  const [usedManualFallback, setUsedManualFallback] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const setPDFDraft = useTableScoreStore((state) => state.setPDFDraft);
  const readMutation = useMutation({ mutationFn: (uri: string) => readImageText(uri) });
  const interpretMutation = useMutation({ mutationFn: ({ game, text }: { game: string; text: string }) => api.interpretScoringText(game, text) });
  const phase = readMutation.isPending ? 'reading' : interpretMutation.isPending ? 'suggesting' : null;
  const suggestedFields = preparedDraft ? extractScoringDraft(preparedDraft)?.fields ?? [] : [];

  function changeGameName(value: string) { setGameName(value); setPreparedDraft(null); }
  function changeText(value: string) { setText(value); setPreparedDraft(null); }

  async function processImage(source: 'camera' | 'library') {
    setError(null);
    try {
      if (source === 'camera') {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) throw new Error('Necesitamos permiso para usar la cámara.');
      }
      const picked = source === 'camera'
        ? await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 1 })
        : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 1 });
      if (picked.canceled || !picked.assets[0]) return;
      const image = picked.assets[0];
      setText('');
      setPreparedDraft(null);
      setUsedManualFallback(false);
      setImageURI(image.uri);
      setImageName(image.fileName ?? 'Imagen de tabla de puntos');
      const recognized = await readMutation.mutateAsync(image.uri);
      setText(recognized);
      if (!recognized) setError('No encontramos texto. Probá con una foto más nítida de toda la tabla.');
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'No pudimos leer la imagen.'); }
  }

  async function prepareSheet() {
    if (!gameName.trim() || !text.trim()) return;
    setError(null);
    setPreparedDraft(null);
    setUsedManualFallback(false);
    const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    const scoringExcerpts = lines.filter((line) => /\b(vp|pv|points?|victory|score|puntos?|victoria)\b/i.test(line)).slice(0, 12);
    let draft: PDFExtract = { fileName: imageName, pages: 1, text: text.trim(), scoringExcerpts: scoringExcerpts.length ? scoringExcerpts : lines.slice(0, 12) };
    try {
      const interpreted = await interpretMutation.mutateAsync({ game: gameName.trim(), text: text.trim() });
      draft = { ...interpreted, fileName: imageName };
    } catch { setUsedManualFallback(true); }
    setPreparedDraft(draft);
  }

  function buildSheet() {
    if (!preparedDraft || !gameName.trim()) return;
    setPDFDraft(preparedDraft);
    router.push({ pathname: '/rules/new', params: { fromImage: '1', game: gameName.trim(), ...(gameId ? { gameId } : {}) } });
  }

  return { gameName, changeGameName, imageURI, text, changeText, phase, preparedDraft,
    usedManualFallback, error, suggestedFields, processImage, prepareSheet, buildSheet };
}
