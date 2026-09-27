export function tableInviteURL(code: string): string {
  return `meepvp://join?code=${encodeURIComponent(code.toUpperCase())}`;
}

export function parseTableCode(value: string): string | null {
  const input = value.trim();
  const code = /^[a-f\d]{6}$/i.test(input)
    ? input
    : /^meepvp:\/\/join\?code=([a-f\d]{6})$/i.exec(input)?.[1];
  return code ? code.toUpperCase() : null;
}
