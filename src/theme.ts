import { scoreUITheme, tokens } from '@decodadev02/scoreui';

const palette = tokens.color;

export const colors = {
  canvas: palette.canvas,
  paper: palette.surface,
  ink: palette.primaryText,
  muted: palette.secondaryText,
  forest: palette.gold,
  forestDark: palette.canvas,
  mint: palette.elevated,
  orange: palette.red,
  orangeInk: palette.gold,
  orangePale: palette.elevated,
  line: palette.border,
  error: palette.warning,
};

export const paperTheme = scoreUITheme;
export { tokens };
