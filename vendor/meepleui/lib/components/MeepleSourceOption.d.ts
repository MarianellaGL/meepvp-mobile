export type MeepleSource = 'pdf' | 'photo' | 'manual';
export type MeepleSourceOptionProps = {
    source: MeepleSource;
    onPress?: () => void;
    disabled?: boolean;
};
/** Una opción por fila; la fila completa abre el siguiente paso. */
export declare function MeepleSourceOption({ source, onPress, disabled }: MeepleSourceOptionProps): import("react").JSX.Element;
