"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScoreGameCard = ScoreGameCard;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_native_1 = require("react-native");
const react_native_paper_1 = require("react-native-paper");
const theme_1 = require("../theme");
function ScoreGameCard({ title, detail, score, label = 'PARTIDA EN CURSO', featured = false }) {
    return ((0, jsx_runtime_1.jsx)(react_native_paper_1.Card, { style: [styles.card, featured && styles.featured], mode: "contained", children: (0, jsx_runtime_1.jsxs)(react_native_paper_1.Card.Content, { style: styles.content, children: [(0, jsx_runtime_1.jsx)(react_native_paper_1.Text, { style: styles.eyebrow, children: label }), (0, jsx_runtime_1.jsx)(react_native_paper_1.Text, { style: styles.title, children: title }), (0, jsx_runtime_1.jsx)(react_native_paper_1.Text, { style: styles.detail, children: detail }), (0, jsx_runtime_1.jsx)(react_native_1.View, { style: styles.divider }), (0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.footer, children: [(0, jsx_runtime_1.jsx)(react_native_paper_1.Text, { style: styles.scoreLabel, children: "PUNTAJE" }), (0, jsx_runtime_1.jsx)(react_native_paper_1.Text, { style: styles.score, children: score })] })] }) }));
}
const styles = react_native_1.StyleSheet.create({
    card: { backgroundColor: theme_1.tokens.color.surface, borderRadius: theme_1.tokens.radius.large },
    featured: { borderColor: theme_1.tokens.color.gold, borderWidth: 1 },
    content: { gap: 12, padding: 24 },
    eyebrow: { color: theme_1.tokens.color.gold, fontFamily: theme_1.tokens.font.medium, fontSize: 12 },
    title: { color: theme_1.tokens.color.primaryText, fontFamily: theme_1.tokens.font.heading, fontSize: 25, textTransform: 'uppercase' },
    detail: { color: theme_1.tokens.color.secondaryText, fontFamily: theme_1.tokens.font.body, fontSize: 14 },
    divider: { backgroundColor: theme_1.tokens.color.border, height: 1, marginTop: 3 },
    footer: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
    scoreLabel: { color: theme_1.tokens.color.secondaryText, fontFamily: theme_1.tokens.font.medium, fontSize: 12 },
    score: { color: theme_1.tokens.color.gold, fontFamily: theme_1.tokens.font.heading, fontSize: 30 },
});
//# sourceMappingURL=ScoreGameCard.js.map