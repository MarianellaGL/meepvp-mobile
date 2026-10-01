export type MeepleAssistStatusProps = {
    title: string;
    description: string;
    kind?: 'working' | 'ready' | 'manual' | 'error';
};
export declare function MeepleAssistStatus({ title, description, kind }: MeepleAssistStatusProps): import("react").JSX.Element;
