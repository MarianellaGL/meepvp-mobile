import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

import type { ScheduledGame } from '@/lib/api';

const prefix = 'tablescore-sheet-';
const channelId = 'game-reminders';
const historyKey = 'tablescore.sheet-reminders.v1';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export async function requestReminderPermission(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(channelId, { name: 'Recordatorios de partidas', importance: Notifications.AndroidImportance.DEFAULT });
  }
  const existing = await Notifications.getPermissionsAsync();
  if (existing.granted) return true;
  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

export async function syncScoreSheetReminders(games: ScheduledGame[]): Promise<void> {
  if (Platform.OS === 'web') return;
  const permission = await Notifications.getPermissionsAsync();
  if (!permission.granted) return;
  const now = Date.now();
  const needed = new Map<string, ScheduledGame>();
  for (const game of games) {
    const when = new Date(game.scheduledAt).getTime();
    if (!game.ruleId && !game.sessionId && when > now) needed.set(`${prefix}${game.id}`, game);
  }
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  const historyRaw = await AsyncStorage.getItem(historyKey);
  let historyIds: string[] = [];
  try {
    const parsed = historyRaw ? JSON.parse(historyRaw) as unknown : [];
    if (Array.isArray(parsed)) historyIds = parsed.filter((id): id is string => typeof id === 'string');
  } catch { /* Invalid local history should not prevent reminders. */ }
  const history = new Set(historyIds);
  const existing = new Set<string>();
  for (const notification of scheduled) {
    if (!notification.identifier.startsWith(prefix)) continue;
    if (needed.has(notification.identifier)) existing.add(notification.identifier);
    else await Notifications.cancelScheduledNotificationAsync(notification.identifier);
  }
  for (const [identifier, game] of needed) {
    if (existing.has(identifier)) continue;
    const dueAt = new Date(game.scheduledAt).getTime() - 24 * 60 * 60 * 1000;
    if (dueAt <= now && history.has(identifier)) continue;
    const reminderAt = Math.max(now + 10_000, dueAt);
    await Notifications.scheduleNotificationAsync({
      identifier,
      content: {
        title: `Falta la planilla de ${game.gameName}`,
        body: 'Se acerca la partida. Creá una planilla o elegí una de la comunidad.',
        data: { url: '/schedule' },
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: new Date(reminderAt), channelId },
    });
    history.add(identifier);
  }
  await AsyncStorage.setItem(historyKey, JSON.stringify([...history].slice(-200)));
}
