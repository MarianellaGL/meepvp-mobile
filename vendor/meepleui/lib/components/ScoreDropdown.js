"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScoreDropdown = ScoreDropdown;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const react_native_1 = require("react-native");
const react_native_paper_1 = require("react-native-paper");
const theme_1 = require("../theme");
function ScoreDropdown({ label, value, options, onChange, disabled = false }) {
    const [open, setOpen] = (0, react_1.useState)(false);
    const selected = options.find((option) => option.value === value)?.label ?? 'Seleccionar';
    return ((0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.root, children: [(0, jsx_runtime_1.jsx)(react_native_paper_1.Text, { style: styles.label, children: label }), (0, jsx_runtime_1.jsx)(react_native_paper_1.Menu, { visible: open, onDismiss: () => setOpen(false), contentStyle: styles.menu, anchor: (0, jsx_runtime_1.jsx)(react_native_paper_1.Button, { mode: "outlined", disabled: disabled, onPress: () => setOpen(true), icon: "chevron-down", textColor: theme_1.tokens.color.primaryText, style: styles.button, contentStyle: styles.buttonContent, children: selected }), children: options.map((option) => (0, jsx_runtime_1.jsx)(react_native_paper_1.Menu.Item, { title: option.label, onPress: () => { onChange?.(option.value); setOpen(false); } }, option.value)) })] }));
}
const styles = react_native_1.StyleSheet.create({
    root: { gap: 8 },
    label: { color: theme_1.tokens.color.primaryText, fontFamily: theme_1.tokens.font.semibold, fontSize: 14 },
    menu: { backgroundColor: theme_1.tokens.color.elevated },
    button: { borderColor: theme_1.tokens.color.border, borderRadius: theme_1.tokens.radius.small, backgroundColor: theme_1.tokens.color.surface },
    buttonContent: { minHeight: 52, justifyContent: 'space-between', flexDirection: 'row-reverse' },
});
//# sourceMappingURL=ScoreDropdown.js.map