export type MeepleImportSource = 'pdf' | 'photo' | 'melodice';
export type MeepleImportProcessingProps = {
    source: MeepleImportSource;
};
/** Barra indeterminada: nunca representa un porcentaje si la API no lo informa. */
export declare function MeepleImportProcessing({ source }: MeepleImportProcessingProps): import("react").JSX.Element;
