export type MeepleScoringPreviewField = {
    name: string;
    kind: 'manual' | 'counter' | 'checkbox';
    pointsPerUnit: number;
};
export type MeepleScoringPreviewProps = {
    gameName: string;
    fields: MeepleScoringPreviewField[];
    notes?: string[];
};
/** Presentational preview only. Fields must be reviewed in the editor before saving. */
export declare function MeepleScoringPreview({ gameName, fields, notes }: MeepleScoringPreviewProps): import("react").JSX.Element;
