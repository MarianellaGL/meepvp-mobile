import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { tokens } from '@/theme';

export type AppTab = 'home' | 'library' | 'new-game' | 'score' | 'profile';
const items: { key: AppTab; label: string; icon: keyof typeof MaterialCommunityIcons.glyphMap }[] = [
  { key: 'home', label: 'Inicio', icon: 'home-outline' },
  { key: 'library', label: 'Biblioteca', icon: 'bookshelf' },
  { key: 'new-game', label: 'Nueva partida', icon: 'plus' },
  { key: 'score', label: 'Puntuar', icon: 'file-document-edit-outline' },
  { key: 'profile', label: 'Perfil', icon: 'account-outline' },
];

export function AppBottomNav({ active, onSelect }: { active: AppTab; onSelect: (tab: AppTab) => void }) {
  const insets = useSafeAreaInsets();
  return <View style={[styles.nav, { paddingBottom: insets.bottom }]}>
    {items.map((item) => {
      const center = item.key === 'new-game';
      const tint = item.key === active ? tokens.color.gold : tokens.color.secondaryText;
      return <Pressable key={item.key} accessibilityRole="tab" accessibilityState={{ selected: item.key === active }} accessibilityLabel={item.label} onPress={() => onSelect(item.key)} style={({ pressed }) => [styles.item, center && styles.centerItem, pressed && styles.pressed]}>
        {center ? <View style={styles.die}>
          <View style={[styles.pip, { left: 6, top: 6 }]} /><View style={[styles.pip, { right: 6, top: 6 }]} />
          <View style={[styles.pip, { left: 6, bottom: 6 }]} /><View style={[styles.pip, { right: 6, bottom: 6 }]} />
          <MaterialCommunityIcons name="plus" size={25} color={tokens.color.primaryText} />
        </View> : <MaterialCommunityIcons name={item.icon} size={24} color={tint} />}
        <Text numberOfLines={1} style={[styles.label, { color: center ? tokens.color.primaryText : tint }]}>{item.label}</Text>
      </Pressable>;
    })}
  </View>;
}

const styles = StyleSheet.create({
  nav: { minHeight: 96, backgroundColor: tokens.color.canvas, borderTopColor: tokens.color.border, borderTopWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', paddingHorizontal: 4 },
  item: { minWidth: 58, minHeight: 72, flex: 1, alignItems: 'center', justifyContent: 'center', gap: 5 },
  centerItem: { flex: 1.4 },
  pressed: { opacity: 0.65 },
  label: { fontFamily: tokens.font.medium, fontSize: 12, letterSpacing: 0.4, textAlign: 'center' },
  die: { width: 44, height: 44, borderRadius: 10, backgroundColor: tokens.color.redDark, alignItems: 'center', justifyContent: 'center', marginTop: -10 },
  pip: { position: 'absolute', width: 3, height: 3, borderRadius: 2, backgroundColor: tokens.color.primaryText },
});
