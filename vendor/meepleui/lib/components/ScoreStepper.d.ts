export type ScoreStepperProps = {
    player: string;
    detail?: string;
    value: number;
    onChange?: (value: number) => void;
    min?: number;
    max?: number;
    disabled?: boolean;
};
export declare function ScoreStepper({ player, detail, value, onChange, min, max, disabled }: ScoreStepperProps): import("react").JSX.Element;
