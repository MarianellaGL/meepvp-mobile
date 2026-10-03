import { Tabs } from 'expo-router';

import { AppBottomNav, type AppTab } from '@/components/AppBottomNav';
import { navigateToTab } from '@/shared/navigation/tabs';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={({ state }) => {
        const route = state.routes[state.index]?.name;
        const active: AppTab = route === 'library' ? 'library' : route === 'profile' ? 'profile' : route === 'tables' ? 'score' : 'home';
        return <AppBottomNav active={active} onSelect={navigateToTab} />;
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Inicio' }} />
      <Tabs.Screen name="profile" options={{ title: 'Perfil' }} />
      <Tabs.Screen name="library" options={{ title: 'Biblioteca' }} />
      <Tabs.Screen name="tables" options={{ title: 'Mesas' }} />
    </Tabs>
  );
}
