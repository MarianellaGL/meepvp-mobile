import { Tabs } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { type ColorValue } from 'react-native';
function TabIcon({ name, color, size }: { name: keyof typeof MaterialCommunityIcons.glyphMap; color: ColorValue; size: number }) { return <MaterialCommunityIcons name={name} color={color as string} size={size} />; }
function HomeIcon({ color, size }: { color: ColorValue; size: number }) { return <TabIcon name="view-dashboard-outline" color={color} size={size} />; }
function LibraryIcon({ color, size }: { color: ColorValue; size: number }) { return <TabIcon name="bookshelf" color={color} size={size} />; }
function TablesIcon({ color, size }: { color: ColorValue; size: number }) { return <TabIcon name="table-furniture" color={color} size={size} />; }
function ProfileIcon({ color, size }: { color: ColorValue; size: number }) { return <TabIcon name="account-circle-outline" color={color} size={size} />; }
export default function TabLayout() { return <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: '#6750A4', tabBarInactiveTintColor: '#79747E', tabBarStyle: { backgroundColor: '#FFFBFE', borderTopColor: '#E8E0E8' } }}><Tabs.Screen name="index" options={{ title: 'Home', tabBarIcon: HomeIcon }} /><Tabs.Screen name="library" options={{ title: 'Library', tabBarIcon: LibraryIcon }} /><Tabs.Screen name="tables" options={{ title: 'Tables', tabBarIcon: TablesIcon }} /><Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: ProfileIcon }} /></Tabs>; }
