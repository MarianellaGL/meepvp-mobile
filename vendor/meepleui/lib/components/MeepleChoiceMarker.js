"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MeepleChoiceMarker = MeepleChoiceMarker;
const jsx_runtime_1 = require("react/jsx-runtime");
const vector_icons_1 = require("@expo/vector-icons");
const react_native_1 = require("react-native");
const theme_1 = require("../theme");
/** Indicador para una sola opción elegida dentro de una fila interactiva. */
function MeepleChoiceMarker({ selected = false }) {
    return (0, jsx_runtime_1.jsx)(react_native_1.View, { accessible: false, style: [styles.ring, selected && styles.selected], children: (0, jsx_runtime_1.jsx)(vector_icons_1.MaterialCommunityIcons, { name: selected ? 'check' : 'chevron-right', size: 20, color: selected ? theme_1.tokens.color.canvas : theme_1.tokens.color.gold }) });
}
const styles = react_native_1.StyleSheet.create({
    ring: { width: 28, height: 28, borderRadius: 14, borderWidth: 1, borderColor: theme_1.tokens.color.gold, backgroundColor: theme_1.tokens.color.elevated, alignItems: 'center', justifyContent: 'center' },
    selected: { borderColor: theme_1.tokens.color.success, backgroundColor: theme_1.tokens.color.success },
});
//# sourceMappingURL=MeepleChoiceMarker.js.map