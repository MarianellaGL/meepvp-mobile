import { router } from 'expo-router';

import type { AppTab } from '@/components/AppBottomNav';

/** One place for what each bottom tab opens, so every screen behaves the same. */
export function navigateToTab(tab: AppTab) {
  if (tab === 'home') router.navigate('/');
  else if (tab === 'library') router.navigate('/library');
  else if (tab === 'profile') router.navigate('/profile');
  else if (tab === 'new-game') router.push('/sessions/new');
  // Partidas: the list, with the game in play on top.
  else router.navigate('/tables');
}
