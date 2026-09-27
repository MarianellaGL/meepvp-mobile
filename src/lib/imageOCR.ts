import { Platform } from 'react-native';

export async function readImageText(uri: string): Promise<string> {
  if (Platform.OS === 'web') throw new Error('Image text recognition is available on iOS and Android only.');
  try {
    const extractor = await import('expo-text-extractor');
    if (!extractor.isSupported) throw new Error('Text recognition is not supported on this device.');
    const lines = await extractor.extractTextFromImage(uri);
    return lines.map((line) => line.trim()).filter(Boolean).join('\n');
  } catch (cause) {
    if (cause instanceof Error && (cause.message.includes('native module') || cause.message.includes('Cannot find native module'))) {
      throw new Error('Image reading needs a development build; it is not available in Expo Go.');
    }
    throw cause;
  }
}
