import { useEffect } from 'react';
import { Stack, router } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { ScoreUIProvider } from '@decodadev02/scoreui';

import { useTableScoreStore } from '@/stores/useTableScoreStore';
import { useAuthStore } from '@/stores/useAuthStore';

export default function RootLayout() {
  const restore = useTableScoreStore((state) => state.restore);
  const restoreAuth = useAuthStore((state) => state.restore);

  useEffect(() => {
    restore().catch(() => undefined);
  }, [restore]);

  useEffect(() => {
    restoreAuth().catch(() => undefined);
  }, [restoreAuth]);

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
    <ScoreUIProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </ScoreUIProvider>
  );
}
