// Pure player-list rules: no React or Expo imports, so tests can load it.

const key = (name: string) => name.normalize('NFD').replace(/[̀-ͯ]/g, '').trim().toLocaleLowerCase();

export function sameName(a: string, b: string): boolean {
  return key(a) === key(b);
}

/** Adds a name unless it is empty, the person themselves or already listed. */
export function addPlayer(players: string[], name: string, selfName: string): string[] {
  const cleaned = name.trim().replace(/\s+/g, ' ').slice(0, 50);
  if (!cleaned || sameName(cleaned, selfName) || players.some((player) => sameName(player, cleaned))) return players;
  return [...players, cleaned];
}

/** Saved players not yet in the game, offered as one-tap suggestions. */
export function playerSuggestions(known: string[], players: string[], selfName: string, limit = 6): string[] {
  return known.filter((name) => !sameName(name, selfName) && !players.some((player) => sameName(player, name))).slice(0, limit);
}

/** Everyone who plays, the person first. */
export function gamePlayers(selfName: string, players: string[]): string[] {
  return [selfName.trim(), ...players].filter(Boolean);
}
