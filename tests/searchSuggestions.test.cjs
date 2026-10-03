const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

const source = fs.readFileSync(path.join(__dirname, '../src/features/search/suggestions.ts'), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
const mod = { exports: {} };
new Function('module', 'exports', 'require', compiled)(mod, mod.exports, require);
const { groupSuggestions, normalizeName } = mod.exports;

const sheet = (id, gameName, bggId, isPublic = false) => ({ id, gameName, bggId, name: 'Base', isPublic, winCondition: 'highest_total', fields: [], createdAt: '' });
const game = (bggId, name, yearPublished) => ({ bggId, name, yearPublished });

test('games with a sheet come first and are not repeated below', () => {
  const result = groupSuggestions('coven', {
    deviceSheets: [sheet('mine', 'Covenant', 200001), sheet('other', 'Everdell', 199792)],
    communitySheets: [sheet('shared', 'Covenant', 200001, true)],
    games: [game(200001, 'Covenant', 2016), game(200002, 'Covenant', 2025), game(200003, 'Covenant Chess', 2026)],
    rulebooks: [{ id: 'rb', name: 'Covenant Chess Rulebook' }],
  });
  assert.equal(result.playable.length, 1);
  assert.equal(result.playable[0].sheets.length, 2);
  assert.equal(result.playable[0].fromCommunity, false);
  assert.deepEqual(result.games.map((item) => item.game.bggId), [200002, 200003]);
  assert.deepEqual(result.games.map((item) => item.hasRulebook), [false, true]);
});

test('device sheets match while typing, ignoring accents and case', () => {
  const result = groupSuggestions('CATÁ', { deviceSheets: [sheet('c', 'Catan')], communitySheets: [], games: [game(13, 'Catan', 1995)], rulebooks: [] });
  assert.equal(result.playable.length, 1);
  assert.equal(result.playable[0].bggId, 13, 'a sheet without BGG ID borrows the matching game');
  assert.equal(result.games.length, 0, 'the game is already listed with its sheet');
  assert.equal(normalizeName('CODEX: Naturalis Rulebook'), 'codex naturalis');
});
