import { useEffect } from 'react';
import { Platform } from 'react-native';
import { Stack, router } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { MeepleUIProvider } from '@decodadev02/meepleui';
import { QueryClientProvider } from '@tanstack/react-query';

import { useTableScoreStore } from '@/stores/useTableScoreStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { queryClient } from '@/lib/queryClient';

export default function RootLayout() {
  const restore = useTableScoreStore((state) => state.restore);
  const restoreAuth = useAuthStore((state) => state.restore);

  useEffect(() => {
    restore().finally(() => restoreAuth().catch(() => undefined));
  }, [restore, restoreAuth]);

  useEffect(() => {
    // Notification responses only exist on native platforms.
    if (Platform.OS === 'web') return;
    const openReminder = (response: Notifications.NotificationResponse) => {
      if (response.notification.request.content.data?.url === '/schedule') router.push('/schedule');
    };
    const last = Notifications.getLastNotificationResponse();
    if (last) openReminder(last);
    const listener = Notifications.addNotificationResponseReceivedListener(openReminder);
    return () => listener.remove();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <MeepleUIProvider>
        <Stack screenOptions={{ headerShown: false }} />
      </MeepleUIProvider>
    </QueryClientProvider>
  );
}
