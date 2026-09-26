import { Stack } from 'expo-router';
import { MD3LightTheme, PaperProvider } from 'react-native-paper';

const theme = {
	...MD3LightTheme,
  colors: {
		...MD3LightTheme.colors,
    primary: '#6750A4',
    secondary: '#625B71',
    background: '#FFFBFE',
    surface: '#FFFBFE',
    surfaceVariant: '#E9E0EB',
  },
};

export default function RootLayout() {
  return (
    <PaperProvider theme={theme}>
      <Stack screenOptions={{ headerShown: false }} />
    </PaperProvider>
  );
}
