export type MeepleUnifiedSearchResultProps = {
    title: string;
    edition?: string;
    imageUrl?: string | null;
    sources: string[];
    needsReview?: boolean;
    onPress?: () => void;
};
/** Un resultado por juego, con las fuentes conocidas y un solo siguiente paso. */
export declare function MeepleUnifiedSearchResult({ title, edition, imageUrl, sources, needsReview, onPress }: MeepleUnifiedSearchResultProps): import("react").JSX.Element;
