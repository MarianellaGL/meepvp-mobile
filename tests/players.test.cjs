const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

const source = fs.readFileSync(path.join(__dirname, '../src/features/sessions/players.ts'), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
const mod = { exports: {} };
new Function('module', 'exports', 'require', compiled)(mod, mod.exports, require);
const { addPlayer, playerSuggestions, gamePlayers } = mod.exports;

test('adds each player once, ignoring case, accents and the person themselves', () => {
  let players = addPlayer([], '  Lucía ', 'Mariana');
  players = addPlayer(players, 'LUCIA', 'Mariana');
  players = addPlayer(players, 'mariana', 'Mariana');
  players = addPlayer(players, '   ', 'Mariana');
  players = addPlayer(players, 'Tomás  Pérez', 'Mariana');
  assert.deepEqual(players, ['Lucía', 'Tomás Pérez']);
  assert.deepEqual(gamePlayers(' Mariana ', players), ['Mariana', 'Lucía', 'Tomás Pérez']);
});

test('suggests saved players who are not in the game yet', () => {
  assert.deepEqual(playerSuggestions(['Mariana', 'Lucía', 'Santiago', 'Ana'], ['lucia'], 'Mariana'), ['Santiago', 'Ana']);
});
