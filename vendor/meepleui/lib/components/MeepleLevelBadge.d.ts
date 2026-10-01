export type MeepleLevel = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
export type MeepleLevelBadgeProps = {
    level: MeepleLevel;
};
/** Level is the number of games won, from one to ten. */
export declare function MeepleLevelBadge({ level }: MeepleLevelBadgeProps): import("react").JSX.Element;
