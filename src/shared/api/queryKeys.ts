// Every server-state cache key lives here so features invalidate each other
// without guessing strings.
export const queryKeys = {
  discovery: (query: string) => ['discovery', query] as const,
  game: (bggId: number) => ['games', bggId] as const,
  ruleAnswer: (bggId: number, question: string) => ['games', bggId, 'answers', question.trim().toLocaleLowerCase()] as const,
  bggRules: (bggId: number) => ['bgg-rules', bggId] as const,
};
