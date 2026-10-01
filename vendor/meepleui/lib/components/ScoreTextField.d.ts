import { TextInput } from 'react-native-paper';
export type ScoreTextFieldProps = {
    mode?: 'outlined';
    label: string;
    value: string;
    onChangeText?: (text: string) => void;
    placeholder?: string;
    helperText?: string;
    errorText?: string;
    disabled?: boolean;
    multiline?: boolean;
    numberOfLines?: number;
    keyboardType?: React.ComponentProps<typeof TextInput>['keyboardType'];
    autoCapitalize?: React.ComponentProps<typeof TextInput>['autoCapitalize'];
    returnKeyType?: React.ComponentProps<typeof TextInput>['returnKeyType'];
    onSubmitEditing?: React.ComponentProps<typeof TextInput>['onSubmitEditing'];
    style?: React.ComponentProps<typeof TextInput>['style'];
};
export declare function ScoreTextField({ label, value, onChangeText, placeholder, helperText, errorText, disabled, multiline, numberOfLines, keyboardType, autoCapitalize, returnKeyType, onSubmitEditing, style }: ScoreTextFieldProps): import("react").JSX.Element;
