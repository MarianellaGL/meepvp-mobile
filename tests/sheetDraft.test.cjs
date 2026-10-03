const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

// The draft module only imports types, which transpilation removes.
const source = fs.readFileSync(path.join(__dirname, '../src/features/sheets/draft.ts'), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
const draftModule = { exports: {} };
new Function('module', 'exports', 'require', compiled)(draftModule, draftModule.exports, require);
const { draftFromSuggestion, withSuggestedFields, describeField, draftProblems, toCreateRule, emptyField } = draftModule.exports;

const everdell = { gameName: 'Everdell', notes: [], fields: [
  { name: 'Cartas', kind: 'manual', pointsPerUnit: 0 },
  { name: 'Fichas de punto', kind: 'counter', pointsPerUnit: 1 },
  { name: 'Evento especial', kind: 'checkbox', pointsPerUnit: 3 },
] };

test('builds a draft from a suggestion and saves the reviewed values', () => {
  const draft = draftFromSuggestion('Everdell', everdell);
  assert.equal(draft.fields.length, 3);
  assert.deepEqual(draftProblems(draft), []);
  draft.fields[1].points = '2';
  const rule = toCreateRule(draft, { bggId: 199792, rulebookId: 'rule-book:en:everdell', canPublish: false });
  assert.deepEqual(rule.fields.map((field) => field.pointsPerUnit), [0, 2, 3]);
  assert.equal(rule.bggId, 199792);
  assert.equal(rule.rulebookId, 'rule-book:en:everdell');
});

test('starts with one empty category and reports what blocks saving', () => {
  const draft = draftFromSuggestion('', null);
  assert.equal(draft.fields.length, 1);
  assert.deepEqual(draftProblems(draft), ['Indicá el juego.', 'Poné nombre a todas las categorías.']);
  draft.gameName = 'Azul';
  draft.fields[0].name = 'Fila';
  draft.fields[0].points = '1.5';
  assert.deepEqual(draftProblems(draft), ['Los puntos tienen que ser números enteros.']);
  draft.fields[0].points = '-2';
  assert.deepEqual(draftProblems(draft), []);
});

test('describes each kind of category in one line', () => {
  assert.equal(describeField({ ...emptyField(), kind: 'counter', points: '3' }), '3 pts cada uno');
  assert.equal(describeField({ ...emptyField(), kind: 'checkbox', points: '1' }), 'Sí / No · 1 pt');
  assert.equal(describeField({ ...emptyField(), kind: 'manual', points: '' }), 'Total libre');
});

test('a proposal replaces categories but keeps the sheet settings', () => {
  const draft = { ...draftFromSuggestion('Everdell', null), name: 'Mi variante', winCondition: 'lowest_total', isPublic: true };
  const next = withSuggestedFields(draft, everdell);
  assert.equal(next.fields.length, 3);
  assert.equal(next.name, 'Mi variante');
  assert.equal(next.winCondition, 'lowest_total');
  assert.equal(next.isPublic, true);
  assert.equal(toCreateRule(next, { canPublish: false }).isPublic, false);
});
