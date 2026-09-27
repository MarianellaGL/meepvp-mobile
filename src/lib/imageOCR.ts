import { Platform } from 'react-native';

export async function readImageText(uri: string): Promise<string> {
  if (Platform.OS === 'web') throw new Error('El reconocimiento de imágenes solo está disponible en iOS y Android.');
  try {
    const extractor = await import('expo-text-extractor');
    if (!extractor.isSupported) throw new Error('Este dispositivo no admite el reconocimiento de texto.');
    const lines = await extractor.extractTextFromImage(uri);
    return lines.map((line) => line.trim()).filter(Boolean).join('\n');
  } catch (cause) {
    if (cause instanceof Error && (cause.message.includes('native module') || cause.message.includes('Cannot find native module'))) {
      throw new Error('Para leer imágenes necesitás una versión nativa de la app; no funciona en Expo Go.');
    }
    throw cause;
  }
}
