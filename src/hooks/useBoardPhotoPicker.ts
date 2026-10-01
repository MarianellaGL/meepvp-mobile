import { useState } from 'react';
import { Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

export function useBoardPhotoPicker(saveBoardPhoto: (asset: ImagePicker.ImagePickerAsset) => Promise<void>) {
  const [photoError, setPhotoError] = useState<string | null>(null);

  async function pickBoardPhoto(source: 'camera' | 'library') {
    setPhotoError(null);
    try {
      if (source === 'camera' && Platform.OS !== 'web') {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) throw new Error('Necesitamos permiso para fotografiar el tablero.');
      }
      const picked = source === 'camera'
        ? await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.6 })
        : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.6 });
      if (picked.canceled || !picked.assets[0]) return;
      await saveBoardPhoto(picked.assets[0]);
    } catch (cause) {
      setPhotoError(cause instanceof Error ? cause.message : 'No pudimos guardar la foto.');
    }
  }

  return { photoError, pickBoardPhoto };
}
