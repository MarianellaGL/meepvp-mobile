"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MeepleUnifiedSearchResult = MeepleUnifiedSearchResult;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const react_native_1 = require("react-native");
const react_native_paper_1 = require("react-native-paper");
const theme_1 = require("../theme");
/** Un resultado por juego, con las fuentes conocidas y un solo siguiente paso. */
function MeepleUnifiedSearchResult({ title, edition, imageUrl, sources, needsReview = false, onPress }) {
    const [failedUrl, setFailedUrl] = (0, react_1.useState)(null);
    const visibleSources = sources.slice(0, 3);
    return ((0, jsx_runtime_1.jsxs)(react_native_1.Pressable, { accessibilityRole: "button", accessibilityLabel: `${title}. ${visibleSources.join('. ')}. Ver opciones`, onPress: onPress, disabled: !onPress, style: ({ pressed }) => [styles.root, pressed && styles.pressed], children: [(0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.header, children: [(0, jsx_runtime_1.jsx)(react_native_1.View, { style: styles.cover, children: imageUrl && imageUrl !== failedUrl ? (0, jsx_runtime_1.jsx)(react_native_1.Image, { source: { uri: imageUrl }, onError: () => setFailedUrl(imageUrl), resizeMode: "cover", style: styles.image, accessibilityIgnoresInvertColors: true }) : (0, jsx_runtime_1.jsx)(react_native_paper_1.Text, { style: styles.coverFallback, children: "Foto" }) }), (0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.gameCopy, children: [(0, jsx_runtime_1.jsx)(react_native_paper_1.Text, { numberOfLines: 1, style: styles.title, children: title }), !!edition && (0, jsx_runtime_1.jsx)(react_native_paper_1.Text, { numberOfLines: 1, style: styles.edition, children: edition })] })] }), (0, jsx_runtime_1.jsx)(react_native_1.View, { style: styles.separator }), (0, jsx_runtime_1.jsx)(react_native_paper_1.Text, { style: styles.eyebrow, children: "FUENTES PARA ESTE JUEGO" }), (0, jsx_runtime_1.jsx)(react_native_1.View, { style: styles.sources, children: visibleSources.map((source, index) => (0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.sourceRow, children: [(0, jsx_runtime_1.jsx)(react_native_1.View, { style: [styles.dot, needsReview && styles.reviewDot] }), (0, jsx_runtime_1.jsx)(react_native_paper_1.Text, { numberOfLines: 1, style: styles.sourceText, children: source })] }, `${source}-${index}`)) }), (0, jsx_runtime_1.jsx)(react_native_paper_1.Text, { style: styles.action, children: needsReview ? 'Revisar opciones →' : 'Ver opciones →' })] }));
}
const styles = react_native_1.StyleSheet.create({
    root: { minHeight: 232, width: '100%', backgroundColor: theme_1.tokens.color.surface, borderColor: theme_1.tokens.color.gold, borderWidth: 1, borderRadius: 16, padding: 11, gap: 10 },
    pressed: { opacity: 0.82 },
    header: { flexDirection: 'row', alignItems: 'center', gap: 14 },
    cover: { width: 54, height: 56, backgroundColor: theme_1.tokens.color.elevated, borderRadius: 8, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
    image: { width: '100%', height: '100%' },
    coverFallback: { color: theme_1.tokens.color.secondaryText, fontFamily: theme_1.tokens.font.body, fontSize: 11 },
    gameCopy: { flex: 1, gap: 6 },
    title: { color: theme_1.tokens.color.primaryText, fontFamily: theme_1.tokens.font.semibold, fontSize: 15 },
    edition: { color: theme_1.tokens.color.secondaryText, fontFamily: theme_1.tokens.font.body, fontSize: 13 },
    separator: { height: 1, backgroundColor: theme_1.tokens.color.border, marginTop: 2 },
    eyebrow: { color: theme_1.tokens.color.secondaryText, fontFamily: theme_1.tokens.font.semibold, fontSize: 10, marginHorizontal: 4 },
    sources: { gap: 9, marginHorizontal: 4 },
    sourceRow: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 18 },
    dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: theme_1.tokens.color.success },
    reviewDot: { backgroundColor: theme_1.tokens.color.brand },
    sourceText: { flex: 1, color: theme_1.tokens.color.secondaryText, fontFamily: theme_1.tokens.font.body, fontSize: 13 },
    action: { color: theme_1.tokens.color.gold, fontFamily: theme_1.tokens.font.semibold, fontSize: 14, marginHorizontal: 4, marginTop: 'auto' },
});
//# sourceMappingURL=MeepleUnifiedSearchResult.js.map