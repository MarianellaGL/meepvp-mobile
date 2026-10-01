"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MeepleSourceOption = MeepleSourceOption;
const jsx_runtime_1 = require("react/jsx-runtime");
const MeepleLibraryEntry_1 = require("./MeepleLibraryEntry");
const content = {
    pdf: { title: 'Subir un PDF', detail: 'Elegí el reglamento o la planilla' },
    photo: { title: 'Usar una foto', detail: 'Fotografiá la tabla de puntos' },
    manual: { title: 'Crear manualmente', detail: 'Armá y ajustá tu planilla' },
};
/** Una opción por fila; la fila completa abre el siguiente paso. */
function MeepleSourceOption({ source, onPress, disabled = false }) {
    const { title, detail } = content[source];
    return (0, jsx_runtime_1.jsx)(MeepleLibraryEntry_1.MeepleLibraryEntry, { title: title, detail: detail, onPress: onPress, disabled: disabled });
}
//# sourceMappingURL=MeepleSourceOption.js.map