export type MeepleDisclosureProps = {
    title: string;
    detail?: string;
    expanded: boolean;
    onPress: () => void;
};
export declare function MeepleDisclosure({ title, detail, expanded, onPress }: MeepleDisclosureProps): import("react").JSX.Element;
