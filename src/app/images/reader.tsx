import { useState } from 'react';
import { Image, ScrollView, StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { MeepleDisclosure, MeepleScoringPreview } from '@decodadev02/meepleui';
import { IconButton, Text, TextInput } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton as Button } from '@/components/AppButton';
import { AssistStatus } from '@/components/AssistStatus';
import { useImageReader } from '@/hooks/useImageReader';
import { colors } from '@/theme';

export default function ImageReaderScreen() {
  const { game, gameId } = useLocalSearchParams<{ game?: string; gameId?: string }>();
  const { gameName, changeGameName, imageURI, text, changeText, phase, preparedDraft,
    usedManualFallback, error, suggestedFields, processImage, prepareSheet, buildSheet } = useImageReader(game, gameId);
  const [showImageSources, setShowImageSources] = useState(false);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.topRow}><IconButton icon="arrow-left" iconColor={colors.forest} onPress={() => router.back()} /><Text style={styles.topLabel}>LECTOR DE PUNTOS</Text><View style={styles.topSpacer} /></View>
        <Text style={styles.title}>Leer puntos de una imagen</Text>
        <Text style={styles.copy}>Elegí una captura o fotografiá una tabla de puntos de victoria. Revisá el texto antes de crear la planilla.</Text>
        <TextInput label="Nombre del juego" value={gameName} editable={phase === null} onChangeText={changeGameName} mode="outlined" />
        {imageURI && <MeepleDisclosure title="Cambiar imagen" expanded={showImageSources} onPress={() => setShowImageSources((shown) => !shown)} />}
        {(!imageURI || showImageSources) && <View style={styles.sourceActions}>
          <Button mode="contained" icon="image" disabled={phase !== null} onPress={() => { setShowImageSources(false); void processImage('library'); }}>Elegir imagen</Button>
          <Button mode="outlined" icon="camera" disabled={phase !== null} onPress={() => { setShowImageSources(false); void processImage('camera'); }}>Tomar foto</Button>
        </View>}
        {imageURI && <Image source={{ uri: imageURI }} style={styles.preview} resizeMode="contain" />}
        {phase && <AssistStatus kind="working" title={phase === 'reading' ? 'Leyendo la imagen' : 'Preparando una propuesta'} description={phase === 'reading' ? 'Reconocemos el texto en tu dispositivo.' : 'Buscamos categorías y multiplicadores en el texto corregido.'} />}
        {error && <Text style={styles.error}>{error}</Text>}
        {!!text && <>
          <Text style={styles.sectionTitle}>Texto reconocido</Text>
          <TextInput label="Corregí los errores de lectura" value={text} editable={phase === null} onChangeText={changeText} mode="outlined" multiline numberOfLines={10} />
          <Text style={styles.copy}>La imagen queda en tu dispositivo. Para sugerir campos enviamos solo el texto corregido.</Text>
          <Button mode="contained" icon="text-box-check-outline" loading={phase === 'suggesting'} disabled={phase !== null || !gameName.trim() || !text.trim()} onPress={prepareSheet}>{preparedDraft ? 'Actualizar propuesta' : 'Preparar propuesta'}</Button>
          {preparedDraft && <>
            <AssistStatus kind={suggestedFields.length ? 'ready' : 'manual'} title={suggestedFields.length ? `${suggestedFields.length} campos para revisar` : 'Planilla manual disponible'} description={suggestedFields.length ? 'Revisá categorías y puntos por unidad antes de guardar.' : usedManualFallback ? 'No pudimos consultar la asistencia. Podés continuar con el texto reconocido.' : 'No encontramos reglas suficientes para proponer campos. Podés armarlos con el texto como referencia.'} />
            {suggestedFields.length > 0 && <MeepleScoringPreview gameName={gameName} fields={suggestedFields} notes={preparedDraft.scoringSuggestion?.notes} />}
            <Button mode="contained" icon="table-edit" disabled={phase !== null} onPress={buildSheet}>{suggestedFields.length ? 'Revisar campos de la planilla' : 'Crear planilla manual'}</Button>
          </>}
        </>}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.canvas },
  content: { gap: 13, padding: 20, paddingBottom: 42 },
  topRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginLeft: -12 },
  topLabel: { color: colors.orangeInk, fontSize: 10, fontWeight: '800', letterSpacing: 1.4 },
  topSpacer: { width: 40 },
  title: { color: colors.ink, fontSize: 30, fontWeight: '800' },
  copy: { color: colors.muted, fontSize: 14, lineHeight: 21 },
  sectionTitle: { color: colors.ink, fontSize: 19, fontWeight: '800' },
  preview: { backgroundColor: colors.paper, borderRadius: 18, height: 240, width: '100%' },
  sourceActions: { gap: 10 },
  error: { color: colors.error },
});
