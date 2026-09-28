import type { PDFExtract, ScoringSuggestion } from '@/lib/api';
import { extractScoringTable } from './scoringTable';

/** Accept reviewed backend templates, retaining older PDFs and printed sheets. */
export function extractScoringDraft(document: PDFExtract): ScoringSuggestion | null {
  const suggestion = document.scoringSuggestion;
  if (suggestion && typeof suggestion.gameName === 'string' && Array.isArray(suggestion.fields) &&
      suggestion.fields.length > 0 && suggestion.fields.length <= 30 &&
      suggestion.fields.every((field) => typeof field.name === 'string' && field.name.trim().length > 0 &&
        ['manual', 'counter', 'checkbox'].includes(field.kind) && Number.isSafeInteger(field.pointsPerUnit)) &&
      Array.isArray(suggestion.notes) && suggestion.notes.every((note) => typeof note === 'string')) {
    return suggestion;
  }
  const table = extractScoringTable(document);
  return table ? {
    gameName: '',
    fields: table.categories.map((name) => ({ name, kind: 'manual', pointsPerUnit: 0 })),
    notes: ['Revisá las categorías de la tabla. Cada campo acepta el puntaje final por jugador.'],
  } : null;
}
