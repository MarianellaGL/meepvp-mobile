import { useEffect } from 'react';
import { Stack, router } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { PaperProvider } from 'react-native-paper';

import { useTableScoreStore } from '@/stores/useTableScoreStore';
import { paperTheme } from '@/theme';

export default function RootLayout() {
  const restore = useTableScoreStore((state) => state.restore);

  useEffect(() => {
    restore().catch(() => undefined);
  }, [restore]);

  useEffect(() => {
    const openReminder = (response: Notifications.NotificationResponse) => {
      if (response.notification.request.content.data?.url === '/schedule') router.push('/schedule');
    };
    const last = Notifications.getLastNotificationResponse();
    if (last) openReminder(last);
    const listener = Notifications.addNotificationResponseReceivedListener(openReminder);
    return () => listener.remove();
  }, []);

  return (
    <PaperProvider theme={paperTheme}>
      <Stack screenOptions={{ headerShown: false }} />
    </PaperProvider>
  );
}
