import type { ReactNode } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import { ScoreButton } from '@decodadev02/scoreui';

type Props = {
  children: ReactNode;
  mode?: 'contained' | 'contained-tonal' | 'outlined' | 'text';
  icon?: string;
  disabled?: boolean;
  loading?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
};

// Keeps screen-level button layout while all button visuals and states come from scoreUI.
export function AppButton({ children, mode, icon, disabled, loading, onPress, style }: Props) {
  return (
    <View style={style}>
      <ScoreButton
        label={String(children)}
        variant={mode === 'outlined' || mode === 'text' || mode === 'contained-tonal' ? 'secondary' : 'primary'}
        icon={icon}
        disabled={disabled}
        loading={loading}
        onPress={onPress}
      />
    </View>
  );
}
