"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MeepleAssistStatus = MeepleAssistStatus;
const jsx_runtime_1 = require("react/jsx-runtime");
const vector_icons_1 = require("@expo/vector-icons");
const react_native_paper_1 = require("react-native-paper");
const react_native_1 = require("react-native");
const theme_1 = require("../theme");
function MeepleAssistStatus({ title, description, kind = 'manual' }) {
    const icon = kind === 'ready' ? 'check-circle-outline' : kind === 'error' ? 'alert-circle-outline' : 'pencil-outline';
    const accent = kind === 'ready' ? theme_1.tokens.color.success : kind === 'error' ? theme_1.tokens.color.warning : theme_1.tokens.color.gold;
    const background = kind === 'ready' ? theme_1.tokens.color.successSoft : kind === 'error' ? theme_1.tokens.color.warningSoft : theme_1.tokens.color.elevated;
    return ((0, jsx_runtime_1.jsxs)(react_native_1.View, { accessibilityRole: kind === 'error' ? 'alert' : undefined, accessibilityLiveRegion: "polite", style: [styles.container, { backgroundColor: background, borderColor: accent }], children: [(0, jsx_runtime_1.jsx)(react_native_1.View, { style: styles.icon, children: kind === 'working' ? (0, jsx_runtime_1.jsx)(react_native_paper_1.ActivityIndicator, { size: 23, color: accent, accessibilityLabel: "Procesando" }) :
                    (0, jsx_runtime_1.jsx)(vector_icons_1.MaterialCommunityIcons, { name: icon, size: 23, color: accent }) }), (0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.text, children: [(0, jsx_runtime_1.jsx)(react_native_paper_1.Text, { style: styles.title, children: title }), (0, jsx_runtime_1.jsx)(react_native_paper_1.Text, { style: styles.description, children: description })] })] }));
}
const styles = react_native_1.StyleSheet.create({
    container: { alignItems: 'flex-start', borderRadius: theme_1.tokens.radius.large, borderWidth: 1, flexDirection: 'row', gap: 11, padding: 14, width: '100%' },
    icon: { alignItems: 'center', backgroundColor: theme_1.tokens.color.surface, borderRadius: 12, height: 42, justifyContent: 'center', width: 42 },
    text: { flex: 1, gap: 3 },
    title: { color: theme_1.tokens.color.primaryText, fontFamily: theme_1.tokens.font.semibold, fontSize: 14 },
    description: { color: theme_1.tokens.color.secondaryText, fontFamily: theme_1.tokens.font.body, fontSize: 13, lineHeight: 19 },
});
//# sourceMappingURL=MeepleAssistStatus.js.map