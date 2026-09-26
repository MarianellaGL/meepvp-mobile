import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { type ColorValue } from 'react-native';

import { colors } from '@/theme';

type IconProps = { color: ColorValue; size: number };
function HomeIcon({ color, size }: IconProps) { return <MaterialCommunityIcons name="home-variant-outline" color={color as string} size={size} />; }
function LibraryIcon({ color, size }: IconProps) { return <MaterialCommunityIcons name="bookshelf" color={color as string} size={size} />; }
function TablesIcon({ color, size }: IconProps) { return <MaterialCommunityIcons name="table-furniture" color={color as string} size={size} />; }
function ProfileIcon({ color, size }: IconProps) { return <MaterialCommunityIcons name="account-outline" color={color as string} size={size} />; }

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.forest,
        tabBarInactiveTintColor: colors.muted,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '700', marginTop: 2 },
        tabBarStyle: {
          backgroundColor: colors.paper,
          borderTopColor: colors.line,
          height: 70,
          paddingTop: 8,
          paddingBottom: 8,
        },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home', tabBarIcon: HomeIcon }} />
      <Tabs.Screen name="library" options={{ title: 'Library', tabBarIcon: LibraryIcon }} />
      <Tabs.Screen name="tables" options={{ title: 'Tables', tabBarIcon: TablesIcon }} />
      <Tabs.Screen name="profile" options={{ title: 'You', tabBarIcon: ProfileIcon }} />
    </Tabs>
  );
}
