// Pure score-sheet logic: no React or Expo imports, so tests can load it directly.
import type { ScoreField, ScoreSession, ScoringRule } from '@/lib/api';

/** The extra row for points the sheet does not cover; it maps to the session's manual points. */
export const otherRowId = 'other';

export type SheetCell = { playerId: string; value: number; points: number };
export type SheetRow = { id: string; name: string; kind: ScoreField['kind'] | 'other'; pointsPerUnit: number; cells: SheetCell[] };
export type SheetColumn = { playerId: string; name: string; total: number; leader: boolean };
export type Sheet = { rows: SheetRow[]; columns: SheetColumn[] };

/** Points a category value is worth, the same way the API adds up totals. */
export function fieldPoints(kind: SheetRow['kind'], pointsPerUnit: number, value: number): number {
  return kind === 'manual' || kind === 'other' ? value : value * pointsPerUnit;
}

/** The paper sheet: one row per category, one column per player, totals and leaders. */
export function buildSheet(rule: Pick<ScoringRule, 'fields' | 'winCondition'>, session: Pick<ScoreSession, 'players' | 'values' | 'manualPoints'>): Sheet {
  const rows: SheetRow[] = rule.fields.map((field) => ({
    id: field.id,
    name: field.name,
    kind: field.kind,
    pointsPerUnit: field.pointsPerUnit,
    cells: session.players.map((player) => {
      const value = session.values[player.id]?.[field.id] ?? 0;
      return { playerId: player.id, value, points: fieldPoints(field.kind, field.pointsPerUnit, value) };
    }),
  }));
  rows.push({
    id: otherRowId,
    name: 'Otros puntos',
    kind: 'other',
    pointsPerUnit: 1,
    cells: session.players.map((player) => {
      const value = session.manualPoints?.[player.id] ?? 0;
      return { playerId: player.id, value, points: value };
    }),
  });

  const totals = session.players.map((_, index) => rows.reduce((sum, row) => sum + row.cells[index].points, 0));
  const someoneScored = rows.some((row) => row.cells.some((cell) => cell.value !== 0));
  const best = rule.winCondition === 'lowest_total' ? Math.min(...totals) : Math.max(...totals);
  const columns = session.players.map((player, index) => ({
    playerId: player.id,
    name: player.name,
    total: totals[index],
    leader: someoneScored && session.players.length > 1 && totals[index] === best,
  }));
  return { rows, columns };
}

/** Short text for a filled cell: the points, plus the quantity when it differs. */
export function cellLabel(row: Pick<SheetRow, 'kind' | 'pointsPerUnit'>, cell: Pick<SheetCell, 'value' | 'points'>): { points: string; detail?: string } {
  if (row.kind === 'checkbox') return cell.value > 0 ? { points: String(cell.points), detail: '✓' } : { points: '–' };
  if (cell.value === 0) return { points: '–' };
  if (row.kind === 'counter' && row.pointsPerUnit !== 1) return { points: String(cell.points), detail: `${cell.value}×` };
  return { points: String(cell.points) };
}

/** How a category is filled in, shown under its name. */
export function rowHint(row: Pick<SheetRow, 'kind' | 'pointsPerUnit'>): string {
  const pts = (value: number) => `${value} ${Math.abs(value) === 1 ? 'pt' : 'pts'}`;
  if (row.kind === 'counter') return `${pts(row.pointsPerUnit)} c/u`;
  if (row.kind === 'checkbox') return `${row.pointsPerUnit > 0 ? '+' : ''}${pts(row.pointsPerUnit)} si se cumple`;
  if (row.kind === 'other') return 'Fuera de la planilla';
  return 'Anotá el total';
}
