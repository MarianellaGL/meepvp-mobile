"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MeepleDisclosure = MeepleDisclosure;
const jsx_runtime_1 = require("react/jsx-runtime");
const vector_icons_1 = require("@expo/vector-icons");
const react_native_1 = require("react-native");
const react_native_paper_1 = require("react-native-paper");
const theme_1 = require("../theme");
function MeepleDisclosure({ title, detail, expanded, onPress }) {
    return ((0, jsx_runtime_1.jsxs)(react_native_1.Pressable, { accessibilityRole: "button", accessibilityState: { expanded }, onPress: onPress, style: styles.container, children: [(0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.text, children: [(0, jsx_runtime_1.jsx)(react_native_paper_1.Text, { style: styles.title, children: title }), detail ? (0, jsx_runtime_1.jsx)(react_native_paper_1.Text, { style: styles.detail, children: detail }) : null] }), (0, jsx_runtime_1.jsx)(vector_icons_1.MaterialCommunityIcons, { name: expanded ? 'chevron-up' : 'chevron-down', size: 22, color: theme_1.tokens.color.gold })] }));
}
const styles = react_native_1.StyleSheet.create({
    container: { alignItems: 'center', backgroundColor: theme_1.tokens.color.surface, borderColor: theme_1.tokens.color.border, borderRadius: theme_1.tokens.radius.large, borderWidth: 1, flexDirection: 'row', justifyContent: 'space-between', minHeight: 52, padding: 16, width: '100%' },
    text: { flex: 1, gap: 3 },
    title: { color: theme_1.tokens.color.primaryText, fontFamily: theme_1.tokens.font.semibold, fontSize: 14 },
    detail: { color: theme_1.tokens.color.secondaryText, fontFamily: theme_1.tokens.font.body, fontSize: 12 },
});
//# sourceMappingURL=MeepleDisclosure.js.map