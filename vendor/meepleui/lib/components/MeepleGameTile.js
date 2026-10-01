"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MeepleGameTile = MeepleGameTile;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const vector_icons_1 = require("@expo/vector-icons");
const react_native_1 = require("react-native");
const react_native_paper_1 = require("react-native-paper");
const theme_1 = require("../theme");
/** Fila de juego con carátula de BGG y estado legible cuando falta la imagen. */
function MeepleGameTile({ title, detail, imageUrl, onPress }) {
    const [failedUrl, setFailedUrl] = (0, react_1.useState)(null);
    return ((0, jsx_runtime_1.jsxs)(react_native_1.Pressable, { onPress: onPress, disabled: !onPress, accessibilityRole: onPress ? 'button' : undefined, accessibilityLabel: title, style: styles.tile, children: [(0, jsx_runtime_1.jsx)(react_native_1.View, { style: styles.cover, children: imageUrl && imageUrl !== failedUrl ? ((0, jsx_runtime_1.jsx)(react_native_1.Image, { source: { uri: imageUrl }, onError: () => setFailedUrl(imageUrl), resizeMode: "cover", style: styles.image, accessibilityIgnoresInvertColors: true })) : ((0, jsx_runtime_1.jsx)(vector_icons_1.MaterialCommunityIcons, { name: "image-off-outline", size: 28, color: theme_1.tokens.color.secondaryText, accessibilityLabel: "Juego sin foto" })) }), (0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.content, children: [(0, jsx_runtime_1.jsx)(react_native_paper_1.Text, { numberOfLines: 2, style: styles.title, children: title }), detail ? (0, jsx_runtime_1.jsx)(react_native_paper_1.Text, { numberOfLines: 2, style: styles.detail, children: detail }) : null] }), onPress ? (0, jsx_runtime_1.jsx)(vector_icons_1.MaterialCommunityIcons, { name: "chevron-right", size: 22, color: theme_1.tokens.color.gold }) : null] }));
}
const styles = react_native_1.StyleSheet.create({
    tile: { minHeight: 80, width: '100%', backgroundColor: theme_1.tokens.color.surface, borderRadius: theme_1.tokens.radius.large, padding: 11, flexDirection: 'row', alignItems: 'center', gap: 12 },
    cover: { width: 54, height: 56, flexShrink: 0, alignItems: 'center', justifyContent: 'center', backgroundColor: theme_1.tokens.color.elevated, borderRadius: theme_1.tokens.radius.small, overflow: 'hidden' },
    image: { width: '100%', height: '100%' },
    content: { flex: 1, gap: 5 },
    title: { color: theme_1.tokens.color.primaryText, fontFamily: theme_1.tokens.font.semibold, fontSize: 16 },
    detail: { color: theme_1.tokens.color.secondaryText, fontFamily: theme_1.tokens.font.body, fontSize: 13 },
});
//# sourceMappingURL=MeepleGameTile.js.map