# @decodadev02/meepleui

Componentes de MeepVP para aplicaciones Expo y React Native con React Native Paper.

## Instalación

En una aplicación Expo SDK 57:

```bash
pnpm add @decodadev02/meepleui react-native-paper @expo/vector-icons
pnpm expo install expo-font react-native-svg
```

## Uso

```tsx
import { MeepleLogo, MeepleUIProvider, ScoreButton } from '@decodadev02/meepleui';

export default function App() {
  return (
    <MeepleUIProvider>
      <MeepleLogo size={64} />
      <ScoreButton label="Nueva partida" onPress={() => {}} />
    </MeepleUIProvider>
  );
}
```

Incluye tokens, tema, logo, íconos de acción, insignias de nivel, avatar, fila de juego con carátula, botón, badge, inputs, checkbox, switch, dropdown, tarjeta de partida, control de puntos, navegación inferior, skeleton y calendario. Para importar reglamentos y planillas incluye `MeepleAssistStatus`, `MeepleScoringPreview` y `MeepleDisclosure`. El catálogo y las stories están en el [repositorio](https://github.com/MarianellaGL/MeepleUI).
