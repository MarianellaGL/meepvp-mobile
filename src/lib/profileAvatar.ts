import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ImagePickerAsset } from 'expo-image-picker';
import { File, Paths } from 'expo-file-system';
import { Platform } from 'react-native';

const keyFor = (userId: string | null) => `meepvp:avatar:${userId ?? 'guest'}`;

export async function loadProfileAvatar(userId: string | null): Promise<string | null> {
  return AsyncStorage.getItem(keyFor(userId));
}

export async function saveProfileAvatar(userId: string | null, asset: ImagePickerAsset): Promise<string> {
  if (asset.fileSize && asset.fileSize > 5 * 1024 * 1024) {
    throw new Error('La foto supera los 5 MB. Elegí una imagen más liviana.');
  }

  const previousUri = await AsyncStorage.getItem(keyFor(userId));
  let uri: string;
  if (Platform.OS === 'web') {
    if (!asset.base64) throw new Error('No pudimos guardar esa foto en este navegador.');
    uri = `data:${asset.mimeType ?? 'image/jpeg'};base64,${asset.base64}`;
  } else {
    const extension = asset.mimeType?.split('/')[1]?.replace('jpeg', 'jpg') ?? 'jpg';
    const destination = new File(Paths.document, `avatar-${userId ?? 'guest'}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extension}`);
    await new File(asset.uri).copy(destination);
    uri = destination.uri;
  }

  await AsyncStorage.setItem(keyFor(userId), uri);
  if (previousUri && previousUri !== uri && Platform.OS !== 'web') {
    try {
      const previousFile = new File(previousUri);
      if (previousFile.exists) previousFile.delete();
    } catch {
      // The new avatar is already saved; a cleanup failure should not hide it.
    }
  }
  return uri;
}

export async function removeProfileAvatar(userId: string | null): Promise<void> {
  const uri = await AsyncStorage.getItem(keyFor(userId));
  await AsyncStorage.removeItem(keyFor(userId));
  if (uri && Platform.OS !== 'web') {
    const file = new File(uri);
    if (file.exists) file.delete();
  }
}
