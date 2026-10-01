"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MeepleScoringPreview = MeepleScoringPreview;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_native_1 = require("react-native");
const react_native_paper_1 = require("react-native-paper");
const theme_1 = require("../theme");
function fieldDescription(field) {
    if (field.kind === 'manual')
        return 'Puntaje final';
    if (field.kind === 'checkbox')
        return `${field.pointsPerUnit} puntos al marcar`;
    return `${field.pointsPerUnit} puntos por unidad`;
}
/** Presentational preview only. Fields must be reviewed in the editor before saving. */
function MeepleScoringPreview({ gameName, fields, notes = [] }) {
    return ((0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.card, children: [(0, jsx_runtime_1.jsx)(react_native_paper_1.Text, { style: styles.eyebrow, children: "PLANILLA PARA REVISAR" }), (0, jsx_runtime_1.jsx)(react_native_paper_1.Text, { style: styles.title, children: gameName ? `Propuesta para ${gameName}` : 'Campos propuestos' }), fields.map((field, index) => ((0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.row, children: [(0, jsx_runtime_1.jsx)(react_native_paper_1.Text, { style: styles.fieldName, children: field.name }), (0, jsx_runtime_1.jsx)(react_native_paper_1.Text, { style: styles.fieldDetail, children: fieldDescription(field) })] }, `${index}-${field.name}`))), notes.map((note, index) => (0, jsx_runtime_1.jsx)(react_native_paper_1.Text, { style: styles.note, children: note }, `${index}-${note}`))] }));
}
const styles = react_native_1.StyleSheet.create({
    card: { backgroundColor: theme_1.tokens.color.surface, borderColor: theme_1.tokens.color.border, borderRadius: theme_1.tokens.radius.large, borderWidth: 1, gap: 10, padding: 17, width: '100%' },
    eyebrow: { color: theme_1.tokens.color.gold, fontFamily: theme_1.tokens.font.semibold, fontSize: 10, letterSpacing: 1.3 },
    title: { color: theme_1.tokens.color.primaryText, fontFamily: theme_1.tokens.font.semibold, fontSize: 18 },
    row: { borderTopColor: theme_1.tokens.color.border, borderTopWidth: 1, flexDirection: 'row', gap: 12, justifyContent: 'space-between', paddingTop: 10 },
    fieldName: { color: theme_1.tokens.color.primaryText, flex: 1, fontFamily: theme_1.tokens.font.medium, fontSize: 13 },
    fieldDetail: { color: theme_1.tokens.color.secondaryText, fontFamily: theme_1.tokens.font.body, fontSize: 12, textAlign: 'right' },
    note: { color: theme_1.tokens.color.secondaryText, fontFamily: theme_1.tokens.font.body, fontSize: 12, lineHeight: 18 },
});
//# sourceMappingURL=MeepleScoringPreview.js.map