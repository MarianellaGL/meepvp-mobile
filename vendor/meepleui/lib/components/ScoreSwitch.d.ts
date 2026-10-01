export type ScoreSwitchProps = {
    label: string;
    value: boolean;
    onChange?: (value: boolean) => void;
    disabled?: boolean;
};
export declare function ScoreSwitch({ label, value, onChange, disabled }: ScoreSwitchProps): import("react").JSX.Element;
