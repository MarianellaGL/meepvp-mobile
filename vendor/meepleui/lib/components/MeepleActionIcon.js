"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MeepleActionIcon = MeepleActionIcon;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_native_1 = require("react-native");
const icons = {
    dice: { source: require('../../assets/figma/action-icons/dice.png'), width: 20.625, height: 20.625 },
    books: { source: require('../../assets/figma/action-icons/books.png'), width: 21.6668, height: 18.5417 },
    users: { source: require('../../assets/figma/action-icons/users.png'), width: 20.625, height: 17.5 },
    calendar: { source: require('../../assets/figma/action-icons/calendar.png'), width: 20.625, height: 20.625 },
    score: { source: require('../../assets/figma/action-icons/score.png'), width: 18.5417, height: 20.625 },
    camera: { source: require('../../assets/figma/action-icons/camera.png'), width: 20.625, height: 18.5417 },
    pdf: { source: require('../../assets/figma/action-icons/pdf.png'), width: 15.4167, height: 22.7083 },
    trophy: { source: require('../../assets/figma/action-icons/trophy.png'), width: 20.625, height: 20.625 },
    shield: { source: require('../../assets/figma/action-icons/shield.png'), width: 20.625, height: 22.7083 },
    person: { source: require('../../assets/figma/action-icons/person.png'), width: 18.5417, height: 20.625 },
    spark: { source: require('../../assets/figma/action-icons/spark.png'), width: 22.7083, height: 22.7083 },
};
/** The action glyphs from the shared MeepVP Figma component. */
function MeepleActionIcon({ type, accessibilityLabel }) {
    const icon = icons[type];
    return ((0, jsx_runtime_1.jsx)(react_native_1.View, { style: styles.container, accessibilityRole: "image", accessibilityLabel: accessibilityLabel ?? type, children: (0, jsx_runtime_1.jsx)(react_native_1.Image, { source: icon.source, style: { width: icon.width, height: icon.height }, resizeMode: "contain", accessible: false }) }));
}
const styles = react_native_1.StyleSheet.create({
    container: { width: 32, height: 32, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
});
//# sourceMappingURL=MeepleActionIcon.js.map