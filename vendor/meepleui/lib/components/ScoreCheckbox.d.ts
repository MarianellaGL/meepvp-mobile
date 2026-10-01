export type ScoreCheckboxProps = {
    label: string;
    checked: boolean;
    onChange?: (checked: boolean) => void;
    disabled?: boolean;
};
export declare function ScoreCheckbox({ label, checked, onChange, disabled }: ScoreCheckboxProps): import("react").JSX.Element;
