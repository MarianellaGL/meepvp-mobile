export type ScoreDropdownOption = {
    label: string;
    value: string;
};
export type ScoreDropdownProps = {
    label: string;
    value: string;
    options: ScoreDropdownOption[];
    onChange?: (value: string) => void;
    disabled?: boolean;
};
export declare function ScoreDropdown({ label, value, options, onChange, disabled }: ScoreDropdownProps): import("react").JSX.Element;
