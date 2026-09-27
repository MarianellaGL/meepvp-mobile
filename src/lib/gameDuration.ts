export function formatPlayedDuration(seconds: number): string {
  const total = Math.max(0, Math.floor(seconds || 0));
  const days = Math.floor(total / 86400);
  const hours = Math.floor((total % 86400) / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  return [days ? `${days} d` : '', hours ? `${hours} h` : '', `${minutes} min`].filter(Boolean).join(' ');
}
