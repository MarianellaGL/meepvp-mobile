import { MD3LightTheme } from 'react-native-paper';

export const colors = {
  canvas: '#F7F4EC',
  paper: '#FFFDFA',
  ink: '#172B28',
  muted: '#64736D',
  forest: '#204F49',
  forestDark: '#153B36',
  mint: '#DDECE3',
  orange: '#E87850',
  orangeInk: '#A8492E',
  orangePale: '#F9E6D8',
  line: '#E8E7DF',
  error: '#B34735',
};

export const paperTheme = {
  ...MD3LightTheme,
  roundness: 18,
  colors: {
    ...MD3LightTheme.colors,
    primary: colors.forest,
    onPrimary: colors.paper,
    primaryContainer: colors.mint,
    onPrimaryContainer: colors.forestDark,
    secondary: colors.orange,
    secondaryContainer: colors.orangePale,
    background: colors.canvas,
    surface: colors.paper,
    surfaceVariant: colors.mint,
    onSurface: colors.ink,
    onSurfaceVariant: colors.muted,
    outline: colors.line,
    error: colors.error,
  },
};
