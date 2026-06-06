import { type ReactNode } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { type StyleProp, type ViewStyle } from "react-native";

type GestureRootProps = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
};

export function GestureRoot({ children, style }: GestureRootProps) {
  return (
    <GestureHandlerRootView style={style}>{children}</GestureHandlerRootView>
  );
}
