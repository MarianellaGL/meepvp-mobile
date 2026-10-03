// Pure grouping of search results: no React or Expo imports, so tests can load it.
import type { CollectionGame, Rulebook, ScoringRule } from '@/lib/api';

export type PlayableSuggestion = { key: string; gameName: string; bggId?: number; sheets: ScoringRule[]; fromCommunity: boolean };
export type GameSuggestion = { game: CollectionGame; hasRulebook: boolean };
export type SearchSuggestions = { playable: PlayableSuggestion[]; games: GameSuggestion[] };

export function normalizeName(value: string): string {
  return value.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+(rulebook|reglamento|regle|règle)$/i, '')
    .replace(/[^a-z0-9]+/gi, ' ').trim().toLocaleLowerCase();
}

/**
 * Games that already have a sheet come first, so people can play right away;
 * the remaining BGG games follow, flagged when MeepVP has their rulebook.
 */
export function groupSuggestions(term: string, input: { deviceSheets: ScoringRule[]; communitySheets: ScoringRule[]; games: CollectionGame[]; rulebooks: Rulebook[] }): SearchSuggestions {
  const needle = normalizeName(term);
  const playable = new Map<string, PlayableSuggestion>();
  const add = (rule: ScoringRule, fromCommunity: boolean) => {
    const key = rule.bggId ? `bgg:${rule.bggId}` : `name:${normalizeName(rule.gameName)}`;
    const entry = playable.get(key) ?? { key, gameName: rule.gameName, bggId: rule.bggId, sheets: [], fromCommunity };
    if (!entry.sheets.some((sheet) => sheet.id === rule.id)) entry.sheets.push(rule);
    entry.fromCommunity = entry.fromCommunity && fromCommunity;
    playable.set(key, entry);
  };
  if (needle) input.deviceSheets.filter((rule) => normalizeName(rule.gameName).includes(needle)).forEach((rule) => add(rule, false));
  input.communitySheets.forEach((rule) => add(rule, true));

  // A sheet without a BGG ID borrows the matching game, so it links to its page
  // and that game is not listed again below.
  for (const entry of playable.values()) {
    if (entry.bggId) continue;
    const match = input.games.find((game) => normalizeName(game.name) === normalizeName(entry.gameName));
    if (match) entry.bggId = match.bggId;
  }
  const playableIds = new Set([...playable.values()].map((entry) => entry.bggId).filter(Boolean));
  const playableNames = new Set([...playable.values()].map((entry) => normalizeName(entry.gameName)));
  const rulebookNames = new Set(input.rulebooks.map((book) => normalizeName(book.name)));
  const seen = new Set<number>();
  const games = input.games.filter((game) => {
    if (seen.has(game.bggId) || playableIds.has(game.bggId) || (!game.bggId && playableNames.has(normalizeName(game.name)))) return false;
    seen.add(game.bggId);
    return true;
  }).map((game) => ({ game, hasRulebook: rulebookNames.has(normalizeName(game.name)) }));

  return { playable: [...playable.values()], games };
}
