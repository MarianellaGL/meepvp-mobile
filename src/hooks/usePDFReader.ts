import { useState } from 'react';
import * as DocumentPicker from 'expo-document-picker';
import { router } from 'expo-router';
import { useMutation } from '@tanstack/react-query';

import { api, type PDFExtract } from '@/lib/api';
import { extractScoringDraft } from '@/lib/scoringDraft';
import { extractScoringTable } from '@/lib/scoringTable';
import { useTableScoreStore } from '@/stores/useTableScoreStore';

type Params = { gameId?: string; game?: string; rulebookId?: string; flow?: string };

export function usePDFReader({ gameId, game, rulebookId, flow }: Params) {
  const [document, setDocument] = useState<PDFExtract | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [retryAsset, setRetryAsset] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [replacingDocument, setReplacingDocument] = useState(false);
  const [gameNameDraft, setGameNameDraft] = useState(game ?? '');
  const [scoringNotesEdit, setScoringNotesEdit] = useState<{ key: string; value: string } | null>(null);
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
  const documentKey = activeDocument ? `${activeDocument.fileName}| ${activeDocument.text.length}|${activeDocument.text.slice(0, 120)}` : '';
  const sourceExcerpts = activeDocument?.scoringExcerpts.length
    ? activeDocument.scoringExcerpts
    : activeDocument?.text.trim().split(/\n+/).filter(Boolean).slice(0, 5) ?? [];
  const scoringNotes = scoringNotesEdit?.key === documentKey
    ? scoringNotesEdit.value
    : sourceExcerpts.map((excerpt) => `• ${excerpt.trim()}`).join('\n');
  const setScoringNotes = (value: string) => setScoringNotesEdit({ key: documentKey, value });
  const scoringPrompt = scoringNotes.split(/\r?\n/).map((line) => line.replace(/^\s*[-•*]\s*/, '').trim()).filter(Boolean).join('\n');
  const canSuggest = !!activeDocument && scoringPrompt.length >= 40 && scoringPrompt.length <= 120_000 && !!name && name.length <= 120;

  const extractMutation = useMutation({ mutationFn: ({ asset, gameName }: { asset: DocumentPicker.DocumentPickerAsset; gameName: string }) => api.extractPDF(asset, gameName) });
  const suggestionMutation = useMutation({ mutationFn: ({ gameName, text }: { gameName: string; text: string }) => api.suggestScoringDraft(gameName, text) });
  const saveMutation = useMutation({ mutationFn: ({ pdf, gameName, bggId }: { pdf: PDFExtract; gameName: string; bggId?: number }) => savePDF(gameName, bggId, pdf) });

  function changeGameName(value: string) {
    setGameNameDraft(value);
    setSavedStatus(null);
  }

  async function persist(pdf: PDFExtract) {
    if (!name) throw new Error('Ingresá el nombre del juego para guardar el texto extraído.');
    await saveMutation.mutateAsync({ pdf, gameName: name, bggId: resolvedGameId });
    setSavedStatus('Extracción guardada en este dispositivo. El archivo PDF original no se conserva.');
  }

  async function saveCurrent() {
    if (!activeDocument) return;
    setError(null);
    try { await persist({ ...activeDocument, scoringExcerpts: scoringPrompt.split('\n') }); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'No pudimos guardar la extracción.'); }
  }

  async function saveAndBuild() {
    if (!activeDocument || !name) return;
    setError(null);
    try {
      const updated = { ...activeDocument, scoringExcerpts: scoringPrompt.split('\n') };
      await persist(updated);
      setPDFDraft(updated);
      router.push({ pathname: '/rules/new', params: { fromPdf: '1', game: name, ...(resolvedGameId ? { gameId: String(resolvedGameId) } : {}), ...(flow === 'setup' ? { flow: 'setup' } : {}) } });
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'No pudimos guardar la extracción.'); }
  }

  async function suggestWithAI() {
    if (!activeDocument || !canSuggest) return;
    setError(null);
    try {
      const result = await suggestionMutation.mutateAsync({ gameName: name, text: scoringPrompt });
      if (!result.scoringSuggestion) {
        setError('La IA no encontró suficientes reglas de puntuación en este texto. Revisá el reglamento o empezá una planilla manual.');
        return;
      }
      const updated = { ...activeDocument, scoringExcerpts: scoringPrompt.split('\n'), scoringSuggestion: result.scoringSuggestion };
      if (!extractScoringDraft(updated)) {
        setError('La propuesta no tiene campos válidos. Probá de nuevo o creá la planilla manualmente.');
        return;
      }
      setDocument(updated);
      setPDFDraft(updated);
      if (name) {
        try { await persist(updated); }
        catch { setError('La propuesta está lista, pero no pudimos guardar el texto en este dispositivo.'); }
      }
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'No pudimos generar la propuesta con IA.'); }
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
    try {
      const result = await extractMutation.mutateAsync({ asset, gameName: name });
      setDocument(result);
      setRetryAsset(null);
      if (!name && result.scoringSuggestion?.gameName) setGameNameDraft(result.scoringSuggestion.gameName);
      setPDFDraft(result);
      if (name) {
        try { await persist(result); }
        catch { setError('Leímos el PDF, pero no pudimos guardar la extracción en este dispositivo.'); }
      }
    } catch (cause) {
      const reason = cause instanceof Error ? cause.message : 'Error desconocido.';
      setError(`No pudimos importar el PDF: ${reason}`);
    }
  }

  async function pickPDF() {
    setError(null);
    try {
      const picked = await DocumentPicker.getDocumentAsync({ type: 'application/pdf', copyToCacheDirectory: true });
      if (picked.canceled) return;
      const asset = picked.assets[0];
      if (!asset) { setError('No seleccionaste ningún archivo.'); return; }
      await importAsset(asset);
    } catch (cause) {
      const reason = cause instanceof Error ? cause.message : 'Error desconocido.';
      setError(`No pudimos seleccionar el PDF: ${reason}`);
    }
  }

  return {
    activeDocument, savedDocument, savedItem, scoringTable, scoringDraft,
    scoringNotes, setScoringNotes, canSuggest,
    gameNameDraft, changeGameName, name, selectedFile, retryAsset, savedStatus, error,
    loading: extractMutation.isPending, saving: saveMutation.isPending, suggesting: suggestionMutation.isPending,
    pickPDF, importAsset, saveCurrent, saveAndBuild, suggestWithAI,
  };
}
