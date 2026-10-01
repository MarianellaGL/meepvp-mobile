export type MeepleActionIconType = 'dice' | 'books' | 'users' | 'calendar' | 'score' | 'camera' | 'pdf' | 'trophy' | 'shield' | 'person' | 'spark';
export type MeepleActionIconProps = {
    type: MeepleActionIconType;
    accessibilityLabel?: string;
};
/** The action glyphs from the shared MeepVP Figma component. */
export declare function MeepleActionIcon({ type, accessibilityLabel }: MeepleActionIconProps): import("react").JSX.Element;
