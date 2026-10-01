export type ScoreButtonProps = {
    label: string;
    variant?: 'primary' | 'secondary' | 'tertiary' | 'danger';
    disabled?: boolean;
    loading?: boolean;
    icon?: string;
    onPress?: () => void;
};
export declare function ScoreButton({ label, variant, disabled, loading, icon, onPress, }: ScoreButtonProps): import("react").JSX.Element;
