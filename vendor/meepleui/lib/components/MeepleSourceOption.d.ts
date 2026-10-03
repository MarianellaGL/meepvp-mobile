export type MeepleSource = 'rulebook' | 'pdf' | 'photo' | 'manual';
export type MeepleSourceOptionProps = {
    source: MeepleSource;
    /** Replaces the default description, e.g. with the rulebook's name. */
    detail?: string;
    /** Highlights the suggested source without marking it as chosen. */
    recommended?: boolean;
    onPress?: () => void;
    disabled?: boolean;
    selected?: boolean;
};
/** Elección de fuente con icono semántico y una fila táctil completa. */
export declare function MeepleSourceOption({ source, detail: detailOverride, recommended, onPress, disabled, selected }: MeepleSourceOptionProps): import("react").JSX.Element;
