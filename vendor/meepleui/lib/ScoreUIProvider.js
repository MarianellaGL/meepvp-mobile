"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScoreUIProvider = ScoreUIProvider;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_native_1 = require("react-native");
const react_native_paper_1 = require("react-native-paper");
const expo_font_1 = require("expo-font");
const inter_1 = require("@expo-google-fonts/inter");
const cinzel_1 = require("@expo-google-fonts/cinzel");
const cinzel_decorative_1 = require("@expo-google-fonts/cinzel-decorative");
const theme_1 = require("./theme");
function ScoreUIProvider({ children }) {
    const [loaded, error] = (0, expo_font_1.useFonts)({
        Inter_400Regular: inter_1.Inter_400Regular,
        Inter_500Medium: inter_1.Inter_500Medium,
        Inter_600SemiBold: inter_1.Inter_600SemiBold,
        Cinzel_700Bold: cinzel_1.Cinzel_700Bold,
        CinzelDecorative_700Bold: cinzel_decorative_1.CinzelDecorative_700Bold,
    });
    if (!loaded && !error) {
        return (0, jsx_runtime_1.jsx)(react_native_1.View, { style: { flex: 1, backgroundColor: theme_1.tokens.color.canvas } });
    }
    return (0, jsx_runtime_1.jsx)(react_native_paper_1.PaperProvider, { theme: theme_1.scoreUITheme, children: children });
}
//# sourceMappingURL=ScoreUIProvider.js.map