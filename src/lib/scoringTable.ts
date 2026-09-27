import type { PDFExtract } from '@/lib/api';

export type ExtractedScoringTable = { columns: string[]; categories: string[] };

/** Recognize printed score sheets without guessing point values from OCR. */
export function extractScoringTable(document: PDFExtract): ExtractedScoringTable | null {
  const lines = document.text.split(/\r?\n/).map((line) => line.trim().replace(/\s+/g, ' ')).filter(Boolean);
  const header = lines.findIndex((line) => /^(categor[ií]as|categories)$/i.test(line));
  if (header < 0) return null;

  const columns: string[] = [];
  const categories: string[] = [];
  const seen = new Set<string>();
  for (const line of lines.slice(header + 1)) {
    if (/^(puntuaci[oó]n total(?: final)?|total(?: score| points)?|puntaje total)$/i.test(line)) break;
    if (/^P[1-9]\d?$/i.test(line)) {
      if (!categories.length && !columns.includes(line.toUpperCase())) columns.push(line.toUpperCase());
      continue;
    }
    if (/^\d+$/.test(line) || line.length < 4 || line.length > 90) continue;
    const key = line.toLocaleLowerCase();
    if (!seen.has(key)) {
      categories.push(line);
      seen.add(key);
    }
  }
  if (!columns.length || !categories.length) return null;
  return { columns, categories };
}
