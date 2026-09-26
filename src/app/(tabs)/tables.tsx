import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { Button, Card, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTableScoreStore } from '@/stores/useTableScoreStore';
export default function TablesScreen() { const { table, session } = useTableScoreStore(); return <SafeAreaView style={s.safe} edges={['top']}><View style={s.content}><Text variant="headlineMedium">Tables</Text><Text style={s.copy}>Your active game spaces.</Text>{table ? <Card mode="contained"><Card.Content><Text variant="titleLarge">{table.name || 'Game night'}</Text><Text style={s.copy}>Code: {table.code}</Text><Button mode="contained" icon="play" onPress={() => session ? router.push(`/sessions/${session.id}`) : router.push('/sessions/new')}>{session ? 'Return to game' : 'Start a game'}</Button></Card.Content></Card> : <Card mode="outlined"><Card.Content><Text variant="titleMedium">No active table</Text><Text style={s.copy}>Create one from Home to start scoring.</Text><Button mode="contained" onPress={() => router.navigate('/')}>Go home</Button></Card.Content></Card>}</View></SafeAreaView>; }
const s = StyleSheet.create({ safe: { flex: 1, backgroundColor: '#FFFBFE' }, content: { gap: 14, padding: 20 }, copy: { color: '#655D6D', marginVertical: 8 } });
