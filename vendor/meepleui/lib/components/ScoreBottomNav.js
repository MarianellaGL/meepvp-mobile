"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScoreBottomNav = ScoreBottomNav;
const jsx_runtime_1 = require("react/jsx-runtime");
const vector_icons_1 = require("@expo/vector-icons");
const react_native_1 = require("react-native");
const react_native_paper_1 = require("react-native-paper");
const theme_1 = require("../theme");
const items = [
    { key: 'home', label: 'Inicio', accessibilityLabel: 'Inicio', icon: 'home-outline' },
    { key: 'library', label: 'Biblioteca', accessibilityLabel: 'Biblioteca' },
    { key: 'new-game', label: 'Nuevo', accessibilityLabel: 'Nueva partida' },
    { key: 'score', label: 'Mesa', accessibilityLabel: 'Mesa', icon: 'file-document-edit-outline' },
    { key: 'profile', label: 'Perfil', accessibilityLabel: 'Perfil', icon: 'account-outline' },
];
function LibraryIcon({ color }) {
    return (0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.libraryIcon, accessible: false, children: [(0, jsx_runtime_1.jsx)(react_native_1.View, { style: [styles.book, styles.bookOne, { borderColor: color }] }), (0, jsx_runtime_1.jsx)(react_native_1.View, { style: [styles.book, styles.bookTwo, { borderColor: color }] }), (0, jsx_runtime_1.jsx)(react_native_1.View, { style: [styles.book, styles.bookThree, { borderColor: color }] })] });
}
function NewGameIcon() {
    return (0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.createAction, accessible: false, children: [(0, jsx_runtime_1.jsx)(react_native_1.View, { style: [styles.pip, styles.topLeft] }), (0, jsx_runtime_1.jsx)(react_native_1.View, { style: [styles.pip, styles.topRight] }), (0, jsx_runtime_1.jsx)(react_native_1.View, { style: [styles.pip, styles.bottomLeft] }), (0, jsx_runtime_1.jsx)(react_native_1.View, { style: [styles.pip, styles.bottomRight] }), (0, jsx_runtime_1.jsx)(vector_icons_1.MaterialCommunityIcons, { name: "plus", size: 29, color: theme_1.tokens.color.canvas })] });
}
function ScoreBottomNav({ active, onSelect }) {
    return (0, jsx_runtime_1.jsx)(react_native_1.View, { style: styles.nav, children: items.map((item) => {
            const selected = item.key === active;
            const center = item.key === 'new-game';
            const tint = selected ? theme_1.tokens.color.gold : theme_1.tokens.color.secondaryText;
            return (0, jsx_runtime_1.jsxs)(react_native_1.Pressable, { accessibilityRole: "tab", accessibilityState: { selected }, accessibilityLabel: item.accessibilityLabel, onPress: () => onSelect?.(item.key), style: ({ pressed }) => [styles.item, center && styles.centerItem, pressed && styles.pressed], children: [center ? (0, jsx_runtime_1.jsx)(NewGameIcon, {}) : item.key === 'library' ? (0, jsx_runtime_1.jsx)(LibraryIcon, { color: tint }) : (0, jsx_runtime_1.jsx)(vector_icons_1.MaterialCommunityIcons, { name: item.icon, size: 24, color: tint }), (0, jsx_runtime_1.jsx)(react_native_paper_1.Text, { numberOfLines: 1, style: [styles.label, { color: center ? theme_1.tokens.color.primaryText : tint }], children: item.label }), selected && (0, jsx_runtime_1.jsx)(react_native_1.View, { style: styles.indicator }), selected && item.key === 'score' && (0, jsx_runtime_1.jsx)(react_native_1.View, { style: styles.liveDot })] }, item.key);
        }) });
}
const styles = react_native_1.StyleSheet.create({
    nav: { minHeight: 96, backgroundColor: theme_1.tokens.color.surface, borderColor: theme_1.tokens.color.border, borderWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' },
    item: { minHeight: 80, flex: 1, alignItems: 'center', justifyContent: 'center', gap: 3 },
    centerItem: { flex: 1.38 },
    pressed: { opacity: 0.7 },
    label: { fontFamily: theme_1.tokens.font.medium, fontSize: 12, lineHeight: 18, letterSpacing: 0.4, textAlign: 'center' },
    indicator: { width: 24, height: 3, borderRadius: 2, backgroundColor: theme_1.tokens.color.brand },
    liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: theme_1.tokens.color.success, position: 'absolute', bottom: 6, right: 15 },
    createAction: { width: 44, height: 44, borderRadius: 12, backgroundColor: theme_1.tokens.color.brand, alignItems: 'center', justifyContent: 'center' },
    pip: { position: 'absolute', width: 3, height: 3, borderRadius: 2, backgroundColor: theme_1.tokens.color.canvas },
    topLeft: { left: 7, top: 7 },
    topRight: { right: 7, top: 7 },
    bottomLeft: { left: 7, bottom: 7 },
    bottomRight: { right: 7, bottom: 7 },
    libraryIcon: { width: 24, height: 24 },
    book: { position: 'absolute', borderWidth: 1.5, borderRadius: 1, width: 5 },
    bookOne: { left: 3, top: 4, height: 16 },
    bookTwo: { left: 9, top: 3, height: 17 },
    bookThree: { left: 15, top: 5, height: 15 },
});
//# sourceMappingURL=ScoreBottomNav.js.map