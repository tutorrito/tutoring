declare module '*.png' {
  const value: import('react-native').ImageSourcePropType;
  export default value;
}

declare module '@react-native-picker/picker' {
  import { ComponentType } from 'react';
  import { ViewProps } from 'react-native';

  export interface PickerItemProps {
    label?: string;
    value?: any;
    color?: string;
    testID?: string;
    style?: any; // Add style prop here
  }

  export interface PickerProps extends ViewProps {
    selectedValue?: any;
    onValueChange?: (itemValue: any, itemIndex: number) => void;
    enabled?: boolean;
    mode?: 'dialog' | 'dropdown';
    prompt?: string;
    itemStyle?: any;
    testID?: string;
    numberOfLines?: number; // Add numberOfLines here
    dropdownIconColor?: string; // Add dropdownIconColor here
    dropdownIconRippleColor?: string; // Add dropdownIconRippleColor here
  }

  export class Picker extends React.Component<PickerProps> {
    static Item: ComponentType<PickerItemProps>;
  }
}
