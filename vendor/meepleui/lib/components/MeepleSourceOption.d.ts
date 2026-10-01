export type MeepleSource = 'pdf' | 'photo' | 'manual';
export type MeepleSourceOptionProps = {
    source: MeepleSource;
    onPress?: () => void;
    disabled?: boolean;
    selected?: boolean;
};
/** Elección de fuente con icono semántico y una fila táctil completa. */
export declare function MeepleSourceOption({ source, onPress, disabled, selected }: MeepleSourceOptionProps): import("react").JSX.Element;
