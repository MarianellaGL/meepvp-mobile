"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScoreBadge = ScoreBadge;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_native_1 = require("react-native");
const react_native_paper_1 = require("react-native-paper");
const theme_1 = require("../theme");
function ScoreBadge({ label, tone = 'neutral' }) {
    const backgroundColor = tone === 'success' ? theme_1.tokens.color.successSoft : tone === 'warning' ? theme_1.tokens.color.warningSoft : theme_1.tokens.color.elevated;
    const color = tone === 'success' ? theme_1.tokens.color.success : tone === 'warning' ? theme_1.tokens.color.warning : theme_1.tokens.color.gold;
    return ((0, jsx_runtime_1.jsx)(react_native_1.View, { style: [styles.badge, { backgroundColor }], children: (0, jsx_runtime_1.jsx)(react_native_paper_1.Text, { style: [styles.label, { color }], children: label }) }));
}
const styles = react_native_1.StyleSheet.create({
    badge: { alignSelf: 'flex-start', borderRadius: 99, paddingHorizontal: 12, paddingVertical: 7 },
    label: { fontFamily: theme_1.tokens.font.semibold, fontSize: 12 },
});
//# sourceMappingURL=ScoreBadge.js.map