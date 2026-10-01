"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScoreButton = ScoreButton;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const react_native_1 = require("react-native");
const react_native_paper_1 = require("react-native-paper");
const theme_1 = require("../theme");
const useReducedMotion_1 = require("../useReducedMotion");
function ScoreButton({ label, variant = 'primary', disabled = false, loading = false, icon, onPress, }) {
    const outlined = variant === 'secondary';
    const textOnly = variant === 'tertiary';
    const danger = variant === 'danger';
    const [scale] = (0, react_1.useState)(() => new react_native_1.Animated.Value(1));
    const reducedMotion = (0, useReducedMotion_1.useReducedMotion)();
    function animatePress(toValue) {
        if (reducedMotion || disabled || loading)
            return;
        react_native_1.Animated.spring(scale, {
            toValue,
            speed: 28,
            bounciness: 2,
            useNativeDriver: true,
        }).start();
    }
    return ((0, jsx_runtime_1.jsx)(react_native_1.Animated.View, { style: [styles.wrapper, { transform: [{ scale }] }], children: (0, jsx_runtime_1.jsx)(react_native_paper_1.Button, { mode: textOnly ? 'text' : outlined ? 'outlined' : 'contained', icon: loading ? undefined : icon, disabled: disabled, accessibilityState: { disabled: disabled || loading, busy: loading }, onPress: loading ? undefined : onPress, onPressIn: () => animatePress(0.97), onPressOut: () => animatePress(1), buttonColor: textOnly ? undefined : outlined ? theme_1.tokens.color.surface : danger ? theme_1.tokens.color.redDark : theme_1.tokens.color.brand, textColor: outlined || textOnly ? theme_1.tokens.color.gold : danger ? theme_1.tokens.color.primaryText : theme_1.tokens.color.canvas, style: [styles.button, outlined && styles.outlined, loading && styles.loading], contentStyle: styles.content, labelStyle: styles.label, children: loading ? 'Cargando…' : label }) }));
}
const styles = react_native_1.StyleSheet.create({
    wrapper: { alignSelf: 'stretch' },
    button: { borderRadius: 12 },
    outlined: { borderColor: theme_1.tokens.color.gold },
    loading: { opacity: 0.8 },
    content: { minHeight: 52 },
    label: { fontFamily: theme_1.tokens.font.semibold, fontSize: 14, marginVertical: 0 },
});
//# sourceMappingURL=ScoreButton.js.map