"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MeepleAvatar = MeepleAvatar;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const vector_icons_1 = require("@expo/vector-icons");
const react_native_1 = require("react-native");
const react_native_paper_1 = require("react-native-paper");
const theme_1 = require("../theme");
function MeepleAvatar({ name, imageUrl, size = 64, onPress }) {
    const [failedUrl, setFailedUrl] = (0, react_1.useState)(null);
    const parts = name.trim().split(/\s+/).filter(Boolean);
    const initials = (parts.length > 1 ? `${parts[0][0]}${parts[parts.length - 1][0]}` : parts[0]?.slice(0, 2) || '?').toLocaleUpperCase();
    const photo = imageUrl && imageUrl !== failedUrl;
    const innerSize = Math.max(24, size - 8);
    return ((0, jsx_runtime_1.jsxs)(react_native_1.Pressable, { onPress: onPress, disabled: !onPress, accessibilityRole: onPress ? 'button' : 'image', accessibilityLabel: onPress ? `Cambiar avatar de ${name}` : `Avatar de ${name}`, style: [styles.container, { width: size, height: size }], children: [(0, jsx_runtime_1.jsx)(react_native_1.View, { style: [styles.avatar, { width: innerSize, height: innerSize, borderRadius: innerSize / 2 }], children: photo ? (0, jsx_runtime_1.jsx)(react_native_1.Image, { source: { uri: imageUrl }, onError: () => setFailedUrl(imageUrl), style: styles.image, accessibilityIgnoresInvertColors: true }) :
                    (0, jsx_runtime_1.jsx)(react_native_1.View, { style: styles.fallback, children: (0, jsx_runtime_1.jsx)(react_native_paper_1.Text, { style: [styles.initial, { fontSize: innerSize * 0.34 }], children: initials }) }) }), onPress && (0, jsx_runtime_1.jsx)(react_native_1.View, { style: styles.editBadge, children: (0, jsx_runtime_1.jsx)(vector_icons_1.MaterialCommunityIcons, { name: "camera-outline", size: 15, color: theme_1.tokens.color.canvas }) })] }));
}
const styles = react_native_1.StyleSheet.create({
    container: { alignItems: 'center', justifyContent: 'center' },
    avatar: { backgroundColor: theme_1.tokens.color.elevated, borderColor: theme_1.tokens.color.gold, borderWidth: 2, overflow: 'hidden' },
    image: { width: '100%', height: '100%' },
    fallback: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    initial: { color: theme_1.tokens.color.gold, fontFamily: theme_1.tokens.font.semibold },
    editBadge: { position: 'absolute', right: 0, bottom: 0, width: 24, height: 24, borderRadius: 12, backgroundColor: theme_1.tokens.color.brand, alignItems: 'center', justifyContent: 'center' },
});
//# sourceMappingURL=MeepleAvatar.js.map