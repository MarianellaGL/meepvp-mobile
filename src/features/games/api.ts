import type { Rulebook, ScoringRule } from '@/lib/api';
import { request } from '@/shared/api/client';

export type GameRulebook = Rulebook & {
  /** The rulebook was already read; rule questions answer faster. */
  textReady: boolean;
};

/** Everything the base holds for one game, identified by its BGG ID. */
export type GameDetail = { bggId: number; rulebooks: GameRulebook[]; scoringRules: ScoringRule[] };

export type RuleCitation = { page: number; text: string };
export type RuleAnswer = { found: boolean; answer: string; citations: RuleCitation[]; rulebook: Rulebook };

export const gamesApi = {
  /** The name links the game's rulebook the first time it is opened. */
  get: (bggId: number, name?: string) => request<GameDetail>(`/v1/games/${bggId}${name ? `?name=${encodeURIComponent(name)}` : ''}`),
  ask: (bggId: number, question: string) => request<RuleAnswer>(`/v1/games/${bggId}/ask`, { method: 'POST', body: JSON.stringify({ question: question.trim() }) }),
};
