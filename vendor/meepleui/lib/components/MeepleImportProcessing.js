"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MeepleImportProcessing = MeepleImportProcessing;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const react_native_1 = require("react-native");
const react_native_paper_1 = require("react-native-paper");
const theme_1 = require("../theme");
const useReducedMotion_1 = require("../useReducedMotion");
const content = {
    pdf: { title: 'Leyendo el PDF', detail: 'Buscamos la tabla de puntos…' },
    photo: { title: 'Leyendo la foto', detail: 'Reconocemos el texto de la imagen…' },
    melodice: { title: 'Importando desde Melodice', detail: 'Preparamos la información del juego…' },
};
/** Barra indeterminada: nunca representa un porcentaje si la API no lo informa. */
function MeepleImportProcessing({ source }) {
    const [position] = (0, react_1.useState)(() => new react_native_1.Animated.Value(0));
    const [trackWidth, setTrackWidth] = (0, react_1.useState)(328);
    const reducedMotion = (0, useReducedMotion_1.useReducedMotion)();
    const { title, detail } = content[source];
    (0, react_1.useEffect)(() => {
        if (reducedMotion) {
            position.setValue(0);
            return;
        }
        const animation = react_native_1.Animated.loop(react_native_1.Animated.sequence([
            react_native_1.Animated.timing(position, { toValue: 1, duration: 1100, useNativeDriver: true }),
            react_native_1.Animated.timing(position, { toValue: 0, duration: 1100, useNativeDriver: true }),
        ]));
        animation.start();
        return () => animation.stop();
    }, [position, reducedMotion]);
    return ((0, jsx_runtime_1.jsxs)(react_native_1.View, { accessibilityRole: "progressbar", accessibilityLabel: `${title}. ${detail}`, style: styles.root, children: [(0, jsx_runtime_1.jsx)(react_native_paper_1.Text, { style: styles.title, children: title }), (0, jsx_runtime_1.jsx)(react_native_paper_1.Text, { style: styles.detail, children: detail }), (0, jsx_runtime_1.jsx)(react_native_1.View, { style: styles.track, onLayout: (event) => setTrackWidth(event.nativeEvent.layout.width), children: (0, jsx_runtime_1.jsx)(react_native_1.Animated.View, { style: [styles.indicator, { transform: [{ translateX: position.interpolate({ inputRange: [0, 1], outputRange: [0, Math.max(0, trackWidth - 104)] }) }] }] }) })] }));
}
const styles = react_native_1.StyleSheet.create({
    root: { width: '100%', backgroundColor: theme_1.tokens.color.surface, borderColor: theme_1.tokens.color.border, borderWidth: 1, borderRadius: 16, padding: 16, gap: 8 },
    title: { color: theme_1.tokens.color.primaryText, fontFamily: theme_1.tokens.font.semibold, fontSize: 15 },
    detail: { color: theme_1.tokens.color.secondaryText, fontFamily: theme_1.tokens.font.body, fontSize: 13 },
    track: { height: 6, width: '100%', backgroundColor: theme_1.tokens.color.elevated, borderRadius: 3, overflow: 'hidden' },
    indicator: { width: 104, height: 6, backgroundColor: theme_1.tokens.color.brand, borderRadius: 3 },
});
//# sourceMappingURL=MeepleImportProcessing.js.map