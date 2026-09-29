import { AppBottomNav, type AppTab } from '@/components/AppBottomNav';
import { Tabs, router } from 'expo-router';

import { useTableScoreStore } from '@/stores/useTableScoreStore';

export default function TabLayout() {
  const table = useTableScoreStore((state) => state.table);
  const session = useTableScoreStore((state) => state.session);

  function select(tab: AppTab) {
    if (tab === 'home') router.navigate('/');
    else if (tab === 'library') router.navigate('/library');
    else if (tab === 'profile') router.navigate('/profile');
    else if (tab === 'new-game') router.push(table ? '/sessions/new' : '/');
    else if (session) router.push(`/sessions/${session.id}`);
    else router.push(table ? '/sessions/new' : '/');
  }

  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={({ state }) => {
        const route = state.routes[state.index]?.name;
        const active: AppTab = route === 'library' ? 'library' : route === 'profile' ? 'profile' : route === 'tables' ? 'score' : 'home';
        return <AppBottomNav active={active} onSelect={select} />;
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Inicio' }} />
      <Tabs.Screen name="profile" options={{ title: 'Perfil' }} />
      <Tabs.Screen name="library" options={{ title: 'Biblioteca' }} />
      <Tabs.Screen name="tables" options={{ title: 'Mesas' }} />
    </Tabs>
  );
}
