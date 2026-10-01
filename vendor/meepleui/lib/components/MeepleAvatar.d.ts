export type MeepleAvatarProps = {
    name: string;
    imageUrl?: string | null;
    size?: number;
    onPress?: () => void;
};
export declare function MeepleAvatar({ name, imageUrl, size, onPress }: MeepleAvatarProps): import("react").JSX.Element;
