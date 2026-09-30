import { StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Text } from 'react-native-paper';

import { colors } from '@/theme';

type Props = {
  title: string;
  description: string;
  kind?: 'working' | 'ready' | 'manual';
};

export function AssistStatus({ title, description, kind = 'manual' }: Props) {
  const icon = kind === 'working' ? 'progress-clock' : kind === 'ready' ? 'check-circle-outline' : 'pencil-outline';
  return (
    <View style={styles.container}>
      <View style={styles.icon}><MaterialCommunityIcons name={icon} size={23} color={colors.forest} /></View>
      <View style={styles.text}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'flex-start', backgroundColor: colors.mint, borderColor: colors.line, borderRadius: 18, borderWidth: 1, flexDirection: 'row', gap: 11, padding: 14 },
  icon: { alignItems: 'center', backgroundColor: colors.paper, borderRadius: 12, height: 42, justifyContent: 'center', width: 42 },
  text: { flex: 1, gap: 3 },
  title: { color: colors.ink, fontSize: 14, fontWeight: '800' },
  description: { color: colors.muted, fontSize: 13, lineHeight: 19 },
});
