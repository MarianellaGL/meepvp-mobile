// Pure sheet-draft logic: no React or Expo imports, so tests can load it directly.
import type { CreateScoringRule, FieldKind, ScoringSuggestion } from '@/lib/api';

export type DraftField = { key: string; name: string; kind: FieldKind; points: string };
export type WinCondition = 'highest_total' | 'lowest_total';
export type SheetDraft = { gameName: string; name: string; winCondition: WinCondition; isPublic: boolean; fields: DraftField[] };

let sequence = 0;
const newKey = () => `field-${Date.now().toString(36)}-${(sequence++).toString(36)}`;

export const kindLabels: Record<FieldKind, string> = {
  counter: 'Cantidad × puntos',
  checkbox: 'Sí / No',
  manual: 'Total libre (cada jugador anota su puntaje)',
};

export function emptyField(): DraftField {
  return { key: newKey(), name: '', kind: 'counter', points: '1' };
}

/** A draft from a reviewed template or AI proposal, or one empty category. */
export function draftFromSuggestion(gameName: string, suggestion?: ScoringSuggestion | null): SheetDraft {
  const fields = suggestion?.fields.length
    ? suggestion.fields.map((field) => ({ key: newKey(), name: field.name, kind: field.kind, points: String(field.pointsPerUnit) }))
    : [emptyField()];
  return { gameName: gameName || suggestion?.gameName || '', name: 'Puntuación estándar', winCondition: 'highest_total', isPublic: false, fields };
}

/** Replaces the categories with a proposal, keeping the rest of the draft. */
export function withSuggestedFields(draft: SheetDraft, suggestion: ScoringSuggestion): SheetDraft {
  return { ...draftFromSuggestion(draft.gameName, suggestion), name: draft.name, winCondition: draft.winCondition, isPublic: draft.isPublic, gameName: draft.gameName || suggestion.gameName };
}

function parsePoints(points: string): number | null {
  const value = Number(points.trim());
  return points.trim() !== '' && Number.isSafeInteger(value) ? value : null;
}

/** One line summary shown on the collapsed category row. */
export function describeField(field: DraftField): string {
  if (field.kind === 'manual') return 'Total libre';
  const points = parsePoints(field.points);
  const amount = points === null ? '? pts' : `${points} ${Math.abs(points) === 1 ? 'pt' : 'pts'}`;
  return field.kind === 'checkbox' ? `Sí / No · ${amount}` : `${amount} cada uno`;
}

/** What still blocks saving, in the order people should fix it. */
export function draftProblems(draft: SheetDraft): string[] {
  const problems: string[] = [];
  if (!draft.gameName.trim()) problems.push('Indicá el juego.');
  if (!draft.fields.length) problems.push('Agregá al menos una categoría.');
  if (draft.fields.some((field) => !field.name.trim())) problems.push('Poné nombre a todas las categorías.');
  if (draft.fields.some((field) => field.kind !== 'manual' && parsePoints(field.points) === null)) problems.push('Los puntos tienen que ser números enteros.');
  return problems;
}

export function toCreateRule(draft: SheetDraft, context: { bggId?: number; rulebookId?: string; canPublish: boolean }): CreateScoringRule {
  return {
    ...(context.rulebookId ? { rulebookId: context.rulebookId } : {}),
    ...(context.bggId && Number.isSafeInteger(context.bggId) && context.bggId > 0 ? { bggId: context.bggId } : {}),
    gameName: draft.gameName.trim(),
    name: draft.name.trim() || 'Puntuación estándar',
    winCondition: draft.winCondition,
    isPublic: draft.isPublic && context.canPublish,
    fields: draft.fields.map((field) => ({
      name: field.name.trim(),
      kind: field.kind,
      pointsPerUnit: field.kind === 'manual' ? 0 : parsePoints(field.points) ?? 0,
    })),
  };
}
