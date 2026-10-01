import { ScoreBottomNav, type ScoreTab } from '@decodadev02/meepleui';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { tokens } from '@/theme';

export type AppTab = ScoreTab;

export function AppBottomNav({ active, onSelect }: { active: AppTab; onSelect: (tab: AppTab) => void }) {
  const insets = useSafeAreaInsets();
  return <View style={{ backgroundColor: tokens.color.surface, paddingBottom: insets.bottom }}>
    <ScoreBottomNav active={active} onSelect={onSelect} />
  </View>;
}
