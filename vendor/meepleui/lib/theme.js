"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.scoreUITheme = exports.meepleUITheme = exports.tokens = void 0;
const react_native_paper_1 = require("react-native-paper");
exports.tokens = {
    color: {
        canvas: '#080B15',
        surface: '#100D1C',
        elevated: '#241024',
        primaryText: '#FFF9F0',
        secondaryText: '#BCAFB9',
        gold: '#FFD47A',
        red: '#F4511E',
        redDark: '#B5253C',
        meepleRed: '#C52C32',
        starBrass: '#B99456',
        levelBadgeBackground: '#1F1C2E',
        levelBadgeBorder: '#A67A40',
        border: '#411B2C',
        brand: '#F2A84B',
        success: '#65D88B',
        successSoft: '#1B402D',
        warning: '#FF6F66',
        warningSoft: '#562026',
    },
    radius: { small: 8, medium: 14, large: 18 },
    space: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 },
    font: {
        body: 'Inter_400Regular',
        medium: 'Inter_500Medium',
        semibold: 'Inter_600SemiBold',
        heading: 'Cinzel_700Bold',
        brand: 'CinzelDecorative_700Bold',
    },
};
exports.meepleUITheme = {
    ...react_native_paper_1.MD3DarkTheme,
    roundness: exports.tokens.radius.medium,
    colors: {
        ...react_native_paper_1.MD3DarkTheme.colors,
        primary: exports.tokens.color.red,
        onPrimary: exports.tokens.color.canvas,
        primaryContainer: exports.tokens.color.redDark,
        onPrimaryContainer: exports.tokens.color.primaryText,
        secondary: exports.tokens.color.gold,
        onSecondary: exports.tokens.color.canvas,
        background: exports.tokens.color.canvas,
        surface: exports.tokens.color.surface,
        surfaceVariant: exports.tokens.color.elevated,
        onSurface: exports.tokens.color.primaryText,
        onSurfaceVariant: exports.tokens.color.secondaryText,
        outline: exports.tokens.color.border,
        error: exports.tokens.color.warning,
    },
};
/** @deprecated Use meepleUITheme. */
exports.scoreUITheme = exports.meepleUITheme;
//# sourceMappingURL=theme.js.map