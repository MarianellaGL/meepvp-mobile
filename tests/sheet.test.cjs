const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

const source = fs.readFileSync(path.join(__dirname, '../src/features/sessions/sheet.ts'), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
const mod = { exports: {} };
new Function('module', 'exports', 'require', compiled)(mod, mod.exports, require);
const { buildSheet, cellLabel, rowHint, otherRowId } = mod.exports;

const rule = {
  winCondition: 'highest_total',
  fields: [
    { id: 'eggs', name: 'Huevos', kind: 'counter', pointsPerUnit: 1 },
    { id: 'gold', name: 'Oro', kind: 'counter', pointsPerUnit: 3 },
    { id: 'goal', name: 'Objetivo', kind: 'checkbox', pointsPerUnit: 5 },
    { id: 'cards', name: 'Cartas', kind: 'manual', pointsPerUnit: 0 },
  ],
};
const players = [{ id: 'ana', name: 'Ana' }, { id: 'leo', name: 'Leo' }];

test('adds up every category and the other points like the API does', () => {
  const sheet = buildSheet(rule, { players, values: { ana: { eggs: 4, gold: 2, goal: 1, cards: 12 }, leo: { cards: 20 } }, manualPoints: { leo: 7 } });
  assert.deepEqual(sheet.rows.map((row) => row.id), ['eggs', 'gold', 'goal', 'cards', otherRowId]);
  assert.deepEqual(sheet.columns.map((column) => [column.name, column.total, column.leader]), [['Ana', 27, true], ['Leo', 27, true]]);
  assert.equal(sheet.rows[1].cells[0].points, 6);
});

test('marks the lowest total as leader when the lowest wins, and nobody before scoring', () => {
  const low = { ...rule, winCondition: 'lowest_total' };
  assert.deepEqual(buildSheet(low, { players, values: { ana: { cards: 3 }, leo: { cards: 9 } } }).columns.map((c) => c.leader), [true, false]);
  assert.deepEqual(buildSheet(rule, { players, values: {} }).columns.map((c) => c.leader), [false, false]);
});

test('labels cells by kind', () => {
  assert.deepEqual(cellLabel({ kind: 'counter', pointsPerUnit: 3 }, { value: 2, points: 6 }), { points: '6', detail: '2×' });
  assert.deepEqual(cellLabel({ kind: 'counter', pointsPerUnit: 1 }, { value: 4, points: 4 }), { points: '4' });
  assert.deepEqual(cellLabel({ kind: 'checkbox', pointsPerUnit: 5 }, { value: 0, points: 0 }), { points: '–' });
  assert.equal(rowHint({ kind: 'counter', pointsPerUnit: 1 }), '1 pt c/u');
});
