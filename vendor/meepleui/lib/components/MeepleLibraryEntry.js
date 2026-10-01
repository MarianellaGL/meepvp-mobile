"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MeepleLibraryEntry = MeepleLibraryEntry;
const jsx_runtime_1 = require("react/jsx-runtime");
const vector_icons_1 = require("@expo/vector-icons");
const react_native_1 = require("react-native");
const react_native_paper_1 = require("react-native-paper");
const theme_1 = require("../theme");
/** Fila de navegación para juegos, planillas y fuentes alternativas. */
function MeepleLibraryEntry({ title, detail, onPress, disabled = false }) {
    return (0, jsx_runtime_1.jsxs)(react_native_1.Pressable, { accessibilityRole: "button", accessibilityLabel: `${title}. ${detail}`, accessibilityState: { disabled: disabled || !onPress }, disabled: disabled || !onPress, onPress: onPress, style: ({ pressed }) => [styles.root, pressed && styles.pressed, disabled && styles.disabled], children: [(0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.copy, children: [(0, jsx_runtime_1.jsx)(react_native_paper_1.Text, { numberOfLines: 1, style: styles.title, children: title }), (0, jsx_runtime_1.jsx)(react_native_paper_1.Text, { numberOfLines: 1, style: styles.detail, children: detail })] }), (0, jsx_runtime_1.jsx)(vector_icons_1.MaterialCommunityIcons, { name: "chevron-right", size: 24, color: theme_1.tokens.color.gold })] });
}
const styles = react_native_1.StyleSheet.create({
    root: { minHeight: 80, width: '100%', backgroundColor: theme_1.tokens.color.surface, borderColor: theme_1.tokens.color.border, borderWidth: 1, borderRadius: 16, paddingHorizontal: 19, flexDirection: 'row', alignItems: 'center', gap: 12 },
    copy: { flex: 1, gap: 7 },
    title: { color: theme_1.tokens.color.primaryText, fontFamily: theme_1.tokens.font.semibold, fontSize: 15 },
    detail: { color: theme_1.tokens.color.secondaryText, fontFamily: theme_1.tokens.font.body, fontSize: 13 },
    pressed: { borderColor: theme_1.tokens.color.gold, opacity: 0.85 },
    disabled: { opacity: 0.45 },
});
//# sourceMappingURL=MeepleLibraryEntry.js.map