import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { IconButton } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppBottomNav, type AppTab } from '@/components/AppBottomNav';
import { navigateToTab } from '@/shared/navigation/tabs';
import { tokens } from '@/theme';

type ScreenProps = {
  title: string;
  subtitle?: string;
  /** Small label above the title, e.g. the section of the app. */
  eyebrow?: string;
  onBack?: () => void;
  /** Primary actions pinned above the tab bar. */
  footer?: ReactNode;
  /** Shows the bottom navigation with this tab selected. */
  tab?: AppTab;
  children: ReactNode;
};

/** Page frame shared by every screen: header, scrolling content, pinned actions and tabs. */
export function Screen({ title, subtitle, eyebrow, onBack, footer, tab, children }: ScreenProps) {
  return <SafeAreaView style={styles.safe} edges={['top']}>
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      {(onBack || eyebrow) && <View style={styles.top}>
        {onBack && <IconButton icon="arrow-left" iconColor={tokens.color.gold} accessibilityLabel="Volver" onPress={onBack} style={styles.back} />}
        {eyebrow && <Text style={styles.eyebrow}>{eyebrow}</Text>}
      </View>}
      <Text accessibilityRole="header" style={styles.title}>{title}</Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      {children}
    </ScrollView>
    {footer && <View style={styles.footer}>{footer}</View>}
    {tab && <AppBottomNav active={tab} onSelect={navigateToTab} />}
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: tokens.color.canvas },
  content: { gap: tokens.space.md, paddingBottom: tokens.space.xl, paddingHorizontal: 20, paddingTop: tokens.space.sm },
  top: { alignItems: 'center', flexDirection: 'row', gap: tokens.space.xs, marginLeft: -tokens.space.sm },
  back: { margin: 0 },
  eyebrow: { color: tokens.color.success, fontFamily: tokens.font.semibold, fontSize: 11, letterSpacing: 1.4 },
  title: { color: tokens.color.primaryText, fontFamily: tokens.font.heading, fontSize: 28, lineHeight: 34 },
  subtitle: { color: tokens.color.secondaryText, fontFamily: tokens.font.body, fontSize: 14, lineHeight: 20, marginTop: -tokens.space.sm },
  footer: { gap: tokens.space.sm, paddingBottom: tokens.space.md, paddingHorizontal: 20, paddingTop: tokens.space.sm },
});
