const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

// Exercise the production TypeScript without importing native Expo modules.
function load(name) {
  const source = fs.readFileSync(path.join(__dirname, '../src/lib', name + '.ts'), 'utf8');
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  const module = { exports: {} };
  new Function('module', 'exports', 'require', compiled)(module, module.exports, (name) => load(name.replace('./', '')));
  return module.exports;
}
const { extractScoringDraft } = load('scoringDraft');
const document = { fileName: 'rules.pdf', pages: 1, text: 'Rules of play', scoringExcerpts: [] };

test('preserves Catan counters and checkbox multipliers through import', () => {
  const suggestion = {
    gameName: 'Catan',
    fields: [
      { name: 'Poblados', kind: 'counter', pointsPerUnit: 1 },
      { name: 'Ciudades', kind: 'counter', pointsPerUnit: 2 },
      { name: 'Gran ejército', kind: 'checkbox', pointsPerUnit: 2 },
    ],
    notes: ['Confirmá el ganador en su turno.'],
  };
  assert.deepEqual(extractScoringDraft({ ...document, scoringSuggestion: suggestion }), suggestion);
});

test('imports Everdell categories as final points, without example multipliers', () => {
  const suggestion = { gameName: 'Everdell', fields: [{ name: 'Viajes', kind: 'manual', pointsPerUnit: 0 }], notes: [] };
  assert.equal(extractScoringDraft({ ...document, scoringSuggestion: suggestion }).fields[0].kind, 'manual');
});

test('retains previously saved printed sheets without backend suggestions', () => {
  const draft = extractScoringDraft({ ...document, text: 'Categorías\nP1\nP2\nMonedas\nObjetivos\nPuntuación total' });
  assert.deepEqual(draft.fields.map((field) => field.name), ['Monedas', 'Objetivos']);
  assert.ok(draft.fields.every((field) => field.kind === 'manual'));
});

test('rejects incomplete suggestions and leaves unsupported prose for manual review', () => {
  assert.equal(extractScoringDraft(document), null);
  assert.equal(extractScoringDraft({ ...document, scoringSuggestion: { gameName: 'Catan', fields: [{}], notes: [] } }), null);
});
