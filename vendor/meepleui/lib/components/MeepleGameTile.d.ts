export type MeepleGameTileProps = {
    title: string;
    detail?: string;
    imageUrl?: string | null;
    onPress?: () => void;
};
/** Fila de juego con carátula de BGG y estado legible cuando falta la imagen. */
export declare function MeepleGameTile({ title, detail, imageUrl, onPress }: MeepleGameTileProps): import("react").JSX.Element;
