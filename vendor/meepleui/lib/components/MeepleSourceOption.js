"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MeepleSourceOption = MeepleSourceOption;
const jsx_runtime_1 = require("react/jsx-runtime");
const vector_icons_1 = require("@expo/vector-icons");
const react_native_1 = require("react-native");
const react_native_paper_1 = require("react-native-paper");
const theme_1 = require("../theme");
const MeepleChoiceMarker_1 = require("./MeepleChoiceMarker");
const content = {
    rulebook: { title: 'Desde el reglamento', detail: 'Usamos el reglamento que ya está en MeepVP.', icon: 'book-open-page-variant-outline' },
    pdf: { title: 'Desde un PDF', detail: 'Leemos las reglas y sugerimos campos.', icon: 'file-pdf-box' },
    photo: { title: 'Desde una foto', detail: 'Capturá la tabla de puntos.', icon: 'camera-outline' },
    manual: { title: 'La armo yo', detail: 'Definí los campos a tu manera.', icon: 'table-edit' },
};
/** Elección de fuente con icono semántico y una fila táctil completa. */
function MeepleSourceOption({ source, detail: detailOverride, recommended = false, onPress, disabled = false, selected = false }) {
    const { title, icon } = content[source];
    const detail = detailOverride ?? content[source].detail;
    return (0, jsx_runtime_1.jsxs)(react_native_1.Pressable, { accessibilityRole: "button", accessibilityLabel: `${recommended ? 'Recomendado. ' : ''}${title}. ${detail}`, accessibilityState: { disabled: disabled || !onPress, selected }, disabled: disabled || !onPress, onPress: onPress, style: ({ pressed }) => [styles.root, (selected || recommended) && styles.selected, pressed && styles.pressed, disabled && styles.disabled], children: [(0, jsx_runtime_1.jsx)(react_native_1.View, { style: styles.icon, children: (0, jsx_runtime_1.jsx)(vector_icons_1.MaterialCommunityIcons, { name: icon, size: 25, color: theme_1.tokens.color.gold }) }), (0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.copy, children: [recommended && (0, jsx_runtime_1.jsx)(react_native_paper_1.Text, { style: styles.badge, children: "RECOMENDADO" }), (0, jsx_runtime_1.jsx)(react_native_paper_1.Text, { style: styles.title, children: title }), (0, jsx_runtime_1.jsx)(react_native_paper_1.Text, { style: styles.detail, children: detail })] }), (0, jsx_runtime_1.jsx)(MeepleChoiceMarker_1.MeepleChoiceMarker, { selected: selected })] });
}
const styles = react_native_1.StyleSheet.create({
    root: { minHeight: 90, width: '100%', backgroundColor: theme_1.tokens.color.surface, borderColor: theme_1.tokens.color.border, borderWidth: 1, borderRadius: 16, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 12 },
    selected: { borderColor: theme_1.tokens.color.gold },
    pressed: { opacity: 0.82 },
    disabled: { opacity: 0.45 },
    icon: { width: 44, height: 44, borderRadius: 12, backgroundColor: theme_1.tokens.color.elevated, alignItems: 'center', justifyContent: 'center' },
    copy: { flex: 1, gap: 5 },
    badge: { color: theme_1.tokens.color.gold, fontFamily: theme_1.tokens.font.semibold, fontSize: 10, letterSpacing: 1.2 },
    title: { color: theme_1.tokens.color.primaryText, fontFamily: theme_1.tokens.font.semibold, fontSize: 15 },
    detail: { color: theme_1.tokens.color.secondaryText, fontFamily: theme_1.tokens.font.body, fontSize: 12, lineHeight: 17 },
});
//# sourceMappingURL=MeepleSourceOption.js.map