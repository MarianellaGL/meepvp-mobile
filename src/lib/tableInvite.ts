export function tableInviteURL(code: string): string {
  return `meepvp://join?code=${encodeURIComponent(code.toUpperCase())}`;
}

export function parseTableCode(value: string): string | null {
  // Pasted codes may carry spaces or dashes ("BC4 C91", "bc4-c91").
  const input = /^meepvp:/i.test(value.trim()) ? value.trim() : value.replace(/[\s-]+/g, '');
  const code = /^[a-f\d]{6}$/i.test(input)
    ? input
    : /^meepvp:\/\/join\?code=([a-f\d]{6})$/i.exec(input)?.[1];
  return code ? code.toUpperCase() : null;
}
