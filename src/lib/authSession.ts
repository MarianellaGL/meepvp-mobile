import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const key = 'meepvp.auth.v1';

export async function loadAuthToken(): Promise<string | null> {
  if (Platform.OS === 'web') return typeof localStorage === 'undefined' ? null : localStorage.getItem(key);
  return SecureStore.getItemAsync(key);
}

export async function saveAuthToken(token: string | null): Promise<void> {
  if (Platform.OS === 'web') {
    if (typeof localStorage === 'undefined') return;
    if (token) localStorage.setItem(key, token);
    else localStorage.removeItem(key);
    return;
  }
  if (token) await SecureStore.setItemAsync(key, token);
  else await SecureStore.deleteItemAsync(key);
}
