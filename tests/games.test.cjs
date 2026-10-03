const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

const source = fs.readFileSync(path.join(__dirname, '../src/features/sessions/games.ts'), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
const mod = { exports: {} };
new Function('module', 'exports', 'require', compiled)(mod, mod.exports, require);
const { listGames, describeGame } = mod.exports;

const session = (id, status, lastModified, extra = {}) => ({ id, status, lastModified, tableCode: 'ABC123', ruleId: 'r', players: [{ id: 'p1', name: 'Mariana' }, { id: 'p2', name: 'Lucía' }], totals: [], winners: [], ...extra });

test('lists ongoing games first and finished ones by date, without repeats', () => {
  const hosted = session('a', 'paused', '2026-10-03T10:00:00Z', { rule: { gameName: 'Brass: Birmingham' } });
  const waiting = session('b', 'waiting', '2026-10-03T11:00:00Z', { tableCode: 'ZZZ999' });
  const finishedOld = { ...session('c', 'finished', '2026-10-01T10:00:00Z', { finishedAt: '2026-10-01T10:00:00Z', winners: [{ playerId: 'p2', total: 30 }] }), gameName: 'Azul', myPlayerId: 'p1' };
  const finishedNew = { ...session('d', 'finished', '2026-10-02T10:00:00Z', { finishedAt: '2026-10-02T10:00:00Z' }), gameName: 'Splendor', myPlayerId: 'p2' };
  const { ongoing, finished } = listGames({
    tables: [{ code: 'abc123', name: 'Mesa', hostToken: 't', createdAt: '' }],
    tableSessions: { ABC123: hosted },
    current: hosted,
    guest: waiting,
    account: [finishedOld, finishedNew, { ...hosted, gameName: 'Brass: Birmingham', myPlayerId: 'p1' }],
    rules: [],
  });
  assert.deepEqual(ongoing.map((game) => game.id), ['b', 'a']);
  assert.equal(ongoing[1].isHost, true);
  assert.equal(ongoing[1].gameName, 'Brass: Birmingham');
  assert.equal(ongoing[1].playerId, 'p1', 'the account link is kept');
  assert.equal(ongoing[0].isHost, false);
  assert.deepEqual(finished.map((game) => game.id), ['d', 'c']);
  assert.equal(describeGame(finished[1]), 'Ganó Lucía · 2 jugadores');
  assert.equal(describeGame(ongoing[0]), 'Esperando jugadores · código ZZZ999');
});
