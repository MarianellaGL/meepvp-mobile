export type MeepleLibraryEntryProps = {
    title: string;
    detail: string;
    onPress?: () => void;
    disabled?: boolean;
};
/** Fila de navegación para juegos, planillas y fuentes alternativas. */
export declare function MeepleLibraryEntry({ title, detail, onPress, disabled }: MeepleLibraryEntryProps): import("react").JSX.Element;
