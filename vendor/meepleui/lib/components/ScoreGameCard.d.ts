export type ScoreGameCardProps = {
    title: string;
    detail: string;
    score: number;
    label?: string;
    featured?: boolean;
};
export declare function ScoreGameCard({ title, detail, score, label, featured }: ScoreGameCardProps): import("react").JSX.Element;
