"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScoreTextField = ScoreTextField;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_native_1 = require("react-native");
const react_native_paper_1 = require("react-native-paper");
const theme_1 = require("../theme");
function ScoreTextField({ label, value, onChangeText, placeholder, helperText, errorText, disabled, multiline, numberOfLines, keyboardType, autoCapitalize, returnKeyType, onSubmitEditing, style }) {
    return ((0, jsx_runtime_1.jsxs)(react_native_1.View, { children: [(0, jsx_runtime_1.jsx)(react_native_paper_1.TextInput, { mode: "outlined", label: label, value: value, onChangeText: onChangeText, placeholder: placeholder, disabled: disabled, multiline: multiline, numberOfLines: numberOfLines, keyboardType: keyboardType, autoCapitalize: autoCapitalize, returnKeyType: returnKeyType, onSubmitEditing: onSubmitEditing, error: Boolean(errorText), textColor: theme_1.tokens.color.primaryText, outlineColor: theme_1.tokens.color.border, activeOutlineColor: theme_1.tokens.color.gold, style: [{ backgroundColor: theme_1.tokens.color.surface }, style] }), (errorText || helperText) && (0, jsx_runtime_1.jsx)(react_native_paper_1.HelperText, { type: errorText ? 'error' : 'info', visible: true, children: errorText || helperText })] }));
}
//# sourceMappingURL=ScoreTextField.js.map