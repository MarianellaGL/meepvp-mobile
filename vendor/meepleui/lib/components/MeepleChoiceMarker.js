"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MeepleChoiceMarker = MeepleChoiceMarker;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_native_1 = require("react-native");
const theme_1 = require("../theme");
/** Indicador para una sola opción elegida dentro de una fila interactiva. */
function MeepleChoiceMarker({ selected = false }) {
    return (0, jsx_runtime_1.jsx)(react_native_1.View, { accessible: false, style: [styles.ring, selected && styles.selected], children: selected && (0, jsx_runtime_1.jsx)(react_native_1.View, { style: styles.dot }) });
}
const styles = react_native_1.StyleSheet.create({
    ring: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: theme_1.tokens.color.border, backgroundColor: theme_1.tokens.color.elevated, alignItems: 'center', justifyContent: 'center' },
    selected: { borderColor: theme_1.tokens.color.gold, backgroundColor: theme_1.tokens.color.brand },
    dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: theme_1.tokens.color.surface },
});
//# sourceMappingURL=MeepleChoiceMarker.js.map