export type ScoreTab = 'home' | 'library' | 'new-game' | 'score' | 'profile';
export type ScoreBottomNavProps = {
    active: ScoreTab;
    onSelect?: (tab: ScoreTab) => void;
};
export declare function ScoreBottomNav({ active, onSelect }: ScoreBottomNavProps): import("react").JSX.Element;
