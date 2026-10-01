"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScoreCheckbox = ScoreCheckbox;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_native_1 = require("react-native");
const react_native_paper_1 = require("react-native-paper");
const theme_1 = require("../theme");
function ScoreCheckbox({ label, checked, onChange, disabled = false }) {
    return ((0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.row, children: [(0, jsx_runtime_1.jsx)(react_native_paper_1.Checkbox, { status: checked ? 'checked' : 'unchecked', onPress: () => onChange?.(!checked), disabled: disabled, color: theme_1.tokens.color.gold, uncheckedColor: theme_1.tokens.color.secondaryText }), (0, jsx_runtime_1.jsx)(react_native_paper_1.Text, { style: [styles.label, disabled && styles.disabled], onPress: () => !disabled && onChange?.(!checked), children: label })] }));
}
const styles = react_native_1.StyleSheet.create({
    row: { minHeight: 48, flexDirection: 'row', alignItems: 'center' },
    label: { color: theme_1.tokens.color.primaryText, fontFamily: theme_1.tokens.font.body, flex: 1 },
    disabled: { opacity: 0.45 },
});
//# sourceMappingURL=ScoreCheckbox.js.map