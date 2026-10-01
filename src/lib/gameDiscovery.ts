import type { CollectionGame, Rulebook, ScoringRule } from './api';

export type GameDiscoveryEntry = {
  key: string;
  game: CollectionGame;
  ownSheets: ScoringRule[];
  communitySheets: ScoringRule[];
  rulebooks: Rulebook[];
  sources: string[];
  needsReview: boolean;
};

function normalizedName(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+(rulebook|reglamento)$/i, '').replace(/[^a-z0-9]+/gi, ' ').trim().toLocaleLowerCase();
}

export function buildGameDiscoveryEntries(
  games: CollectionGame[],
  ownSheets: ScoringRule[],
  communitySheets: ScoringRule[],
  rulebooks: Rulebook[],
): GameDiscoveryEntry[] {
  const entries = new Map<string, GameDiscoveryEntry>();
  const byId = new Map<number, GameDiscoveryEntry>();
  const byName = new Map<string, GameDiscoveryEntry>();

  function addGame(game: CollectionGame): GameDiscoveryEntry {
    const nameKey = normalizedName(game.name);
    const sameName = byName.get(nameKey);
    const existing = byId.get(game.bggId) ?? (sameName && (sameName.game.bggId === 0 || game.bggId === 0) ? sameName : undefined);
    if (existing) {
      existing.game = { ...existing.game, ...game, imageUrl: game.imageUrl || existing.game.imageUrl, thumbnailUrl: game.thumbnailUrl || existing.game.thumbnailUrl };
      if (game.bggId > 0) byId.set(game.bggId, existing);
      return existing;
    }
    const entry: GameDiscoveryEntry = { key: game.bggId > 0 ? `bgg:${game.bggId}` : `name:${nameKey}`, game, ownSheets: [], communitySheets: [], rulebooks: [], sources: [], needsReview: false };
    entries.set(entry.key, entry);
    if (!byName.has(nameKey)) byName.set(nameKey, entry);
    if (game.bggId > 0) byId.set(game.bggId, entry);
    return entry;
  }

  function fromName(name: string, bggId?: number): GameDiscoveryEntry {
    const matchingName = byName.get(normalizedName(name));
    return (bggId ? byId.get(bggId) : undefined) ??
      (matchingName && (!bggId || matchingName.game.bggId === bggId || matchingName.game.bggId === 0) ? matchingName : undefined) ??
      addGame({ bggId: bggId ?? 0, name });
  }

  games.forEach(addGame);
  ownSheets.forEach((rule) => fromName(rule.gameName, rule.bggId).ownSheets.push(rule));
  communitySheets.forEach((rule) => fromName(rule.gameName, rule.bggId).communitySheets.push(rule));
  rulebooks.forEach((book) => fromName(book.name).rulebooks.push(book));

  return [...entries.values()].map((entry) => {
    const sources: string[] = [];
    if (entry.ownSheets.length) sources.push(`Mi planilla · ${entry.ownSheets.length === 1 ? 'lista para jugar' : `${entry.ownSheets.length} listas para jugar`}`);
    if (entry.communitySheets.length) sources.push(`Comunidad · ${entry.communitySheets.length} ${entry.communitySheets.length === 1 ? 'planilla' : 'planillas'}`);
    if (entry.rulebooks.length) sources.push(`Reglamento · ${entry.rulebooks.length === 1 ? 'disponible' : `${entry.rulebooks.length} disponibles`}`);
    if (!sources.length) sources.push('Sin planilla confiable');
    if (!entry.ownSheets.length && !entry.communitySheets.length) sources.push('Podés revisar una propuesta editable');
    entry.sources = sources;
    entry.needsReview = !entry.ownSheets.length && !entry.communitySheets.length;
    return entry;
  });
}
