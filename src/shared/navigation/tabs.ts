import { router } from 'expo-router';

import type { AppTab } from '@/components/AppBottomNav';
import { useTableScoreStore } from '@/stores/useTableScoreStore';

/** One place for what each bottom tab opens, so every screen behaves the same. */
export function navigateToTab(tab: AppTab) {
  const { table, session } = useTableScoreStore.getState();
  if (tab === 'home') router.navigate('/');
  else if (tab === 'library') router.navigate('/library');
  else if (tab === 'profile') router.navigate('/profile');
  else if (tab === 'new-game') router.push('/sessions/new');
  else if (session) router.push(`/sessions/${session.id}`);
  else router.navigate(table ? '/tables' : '/');
}
