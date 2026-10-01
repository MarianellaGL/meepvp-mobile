"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScoreStepper = ScoreStepper;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const react_native_1 = require("react-native");
const react_native_paper_1 = require("react-native-paper");
const theme_1 = require("../theme");
const useReducedMotion_1 = require("../useReducedMotion");
function ScoreStepper({ player, detail, value, onChange, min = 0, max = 999, disabled = false }) {
    const adjust = (delta) => onChange?.(Math.max(min, Math.min(max, value + delta)));
    const [scale] = (0, react_1.useState)(() => new react_native_1.Animated.Value(1));
    const previous = (0, react_1.useRef)(value);
    const reducedMotion = (0, useReducedMotion_1.useReducedMotion)();
    (0, react_1.useEffect)(() => {
        if (previous.current !== value && !reducedMotion) {
            scale.setValue(1.16);
            react_native_1.Animated.spring(scale, { toValue: 1, speed: 24, bounciness: 4, useNativeDriver: true }).start();
        }
        previous.current = value;
    }, [value, reducedMotion, scale]);
    return ((0, jsx_runtime_1.jsxs)(react_native_1.View, { style: [styles.row, disabled && styles.disabled], children: [(0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.person, children: [(0, jsx_runtime_1.jsx)(react_native_paper_1.Text, { style: styles.name, children: player }), detail && (0, jsx_runtime_1.jsx)(react_native_paper_1.Text, { style: styles.detail, children: detail })] }), (0, jsx_runtime_1.jsx)(react_native_1.Pressable, { accessibilityRole: "button", accessibilityLabel: `Restar un punto a ${player}`, disabled: disabled || value <= min, onPress: () => adjust(-1), style: styles.control, children: (0, jsx_runtime_1.jsx)(react_native_paper_1.Text, { style: styles.symbol, children: "\u2212" }) }), (0, jsx_runtime_1.jsx)(react_native_1.Animated.View, { style: { transform: [{ scale }] }, children: (0, jsx_runtime_1.jsx)(react_native_paper_1.Text, { accessibilityLabel: `${value} puntos`, style: styles.value, children: value }) }), (0, jsx_runtime_1.jsx)(react_native_1.Pressable, { accessibilityRole: "button", accessibilityLabel: `Sumar un punto a ${player}`, disabled: disabled || value >= max, onPress: () => adjust(1), style: styles.control, children: (0, jsx_runtime_1.jsx)(react_native_paper_1.Text, { style: styles.symbol, children: "+" }) })] }));
}
const styles = react_native_1.StyleSheet.create({
    row: { minHeight: 88, backgroundColor: theme_1.tokens.color.surface, borderRadius: theme_1.tokens.radius.medium, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 6 },
    disabled: { opacity: 0.45 },
    person: { flex: 1, gap: 4 },
    name: { color: theme_1.tokens.color.primaryText, fontFamily: theme_1.tokens.font.semibold, fontSize: 14 },
    detail: { color: theme_1.tokens.color.secondaryText, fontFamily: theme_1.tokens.font.body, fontSize: 12 },
    control: { width: 44, height: 44, borderRadius: 22, backgroundColor: theme_1.tokens.color.elevated, alignItems: 'center', justifyContent: 'center' },
    symbol: { color: theme_1.tokens.color.gold, fontFamily: theme_1.tokens.font.medium, fontSize: 24 },
    value: { color: theme_1.tokens.color.primaryText, fontFamily: theme_1.tokens.font.semibold, minWidth: 30, textAlign: 'center' },
});
//# sourceMappingURL=ScoreStepper.js.map