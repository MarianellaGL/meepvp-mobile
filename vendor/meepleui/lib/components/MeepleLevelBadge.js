"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MeepleLevelBadge = MeepleLevelBadge;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_native_1 = require("react-native");
const theme_1 = require("../theme");
const levels = {
    1: { name: 'Aprendiz', source: require('../../assets/figma/level-badges/aprendiz.png') },
    2: { name: 'Jugón', source: require('../../assets/figma/level-badges/jugon.png') },
    3: { name: 'Aventurera', source: require('../../assets/figma/level-badges/aventurera.png') },
    4: { name: 'Guardián', source: require('../../assets/figma/level-badges/guardian.png') },
    5: { name: 'Mercenario', source: require('../../assets/figma/level-badges/mercenario.png') },
    6: { name: 'Druida', source: require('../../assets/figma/level-badges/druida.png') },
    7: { name: 'Caballero', source: require('../../assets/figma/level-badges/caballero.png') },
    8: { name: 'Ganador', source: require('../../assets/figma/level-badges/ganador.png') },
    9: { name: 'Rey', source: require('../../assets/figma/level-badges/rey.png') },
    10: { name: 'Leyenda', source: require('../../assets/figma/level-badges/leyenda.png') },
};
/** Level is the number of games won, from one to ten. */
function MeepleLevelBadge({ level }) {
    const badge = levels[level];
    return ((0, jsx_runtime_1.jsx)(react_native_1.View, { style: styles.badge, accessibilityRole: "image", accessibilityLabel: `Nivel ${level}: ${badge.name}`, children: (0, jsx_runtime_1.jsx)(react_native_1.Image, { source: badge.source, style: styles.icon, resizeMode: "contain", accessible: false }) }));
}
const styles = react_native_1.StyleSheet.create({
    badge: {
        width: 68,
        height: 68,
        borderRadius: 22,
        borderWidth: 1,
        borderColor: theme_1.tokens.color.levelBadgeBorder,
        backgroundColor: theme_1.tokens.color.levelBadgeBackground,
        alignItems: 'center',
        justifyContent: 'center',
    },
    icon: { width: 44, height: 44 },
});
//# sourceMappingURL=MeepleLevelBadge.js.map