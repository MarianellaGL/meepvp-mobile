"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScoreSkeleton = ScoreSkeleton;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const react_native_1 = require("react-native");
const theme_1 = require("../theme");
const useReducedMotion_1 = require("../useReducedMotion");
function ScoreSkeleton({ variant = 'text' }) {
    const [opacity] = (0, react_1.useState)(() => new react_native_1.Animated.Value(1));
    const reducedMotion = (0, useReducedMotion_1.useReducedMotion)();
    (0, react_1.useEffect)(() => {
        if (reducedMotion) {
            opacity.setValue(1);
            return;
        }
        const pulse = react_native_1.Animated.loop(react_native_1.Animated.sequence([
            react_native_1.Animated.timing(opacity, { toValue: 0.5, duration: 700, useNativeDriver: true }),
            react_native_1.Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        ]));
        pulse.start();
        return () => pulse.stop();
    }, [opacity, reducedMotion]);
    if (variant === 'text')
        return (0, jsx_runtime_1.jsx)(react_native_1.Animated.View, { accessibilityLabel: "Cargando", style: [styles.bar, { width: '72%', opacity }] });
    if (variant === 'list')
        return (0, jsx_runtime_1.jsx)(react_native_1.View, { accessibilityLabel: "Cargando lista", style: styles.list, children: [0, 1, 2].map((item) => (0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.row, children: [(0, jsx_runtime_1.jsx)(react_native_1.Animated.View, { style: [styles.circle, { opacity }] }), (0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.lines, children: [(0, jsx_runtime_1.jsx)(react_native_1.Animated.View, { style: [styles.bar, { width: '80%', opacity }] }), (0, jsx_runtime_1.jsx)(react_native_1.Animated.View, { style: [styles.bar, { width: '55%', opacity }] })] })] }, item)) });
    return (0, jsx_runtime_1.jsxs)(react_native_1.View, { accessibilityLabel: "Cargando tarjeta", style: styles.card, children: [(0, jsx_runtime_1.jsx)(react_native_1.Animated.View, { style: [styles.bar, { width: '35%', opacity }] }), (0, jsx_runtime_1.jsx)(react_native_1.Animated.View, { style: [styles.bar, { width: '75%', height: 28, opacity }] }), (0, jsx_runtime_1.jsx)(react_native_1.Animated.View, { style: [styles.bar, { width: '95%', opacity }] }), (0, jsx_runtime_1.jsx)(react_native_1.Animated.View, { style: [styles.bar, { width: '50%', opacity }] })] });
}
const styles = react_native_1.StyleSheet.create({
    bar: { backgroundColor: theme_1.tokens.color.elevated, height: 16, borderRadius: 8 },
    list: { backgroundColor: theme_1.tokens.color.surface, padding: 16, borderRadius: theme_1.tokens.radius.medium, gap: 18 },
    row: { flexDirection: 'row', gap: 12, alignItems: 'center' },
    circle: { backgroundColor: theme_1.tokens.color.elevated, width: 42, height: 42, borderRadius: 21 },
    lines: { flex: 1, gap: 9 },
    card: { backgroundColor: theme_1.tokens.color.surface, padding: 24, borderRadius: theme_1.tokens.radius.large, gap: 17 },
});
//# sourceMappingURL=ScoreSkeleton.js.map