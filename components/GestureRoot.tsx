import { useEffect, useState, type ReactNode } from "react";
import { View, type StyleProp, type ViewStyle } from "react-native";

import { isExpoGoNative } from "../lib/expoGoNative";

type GestureRootProps = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
};

export function GestureRoot({ children, style }: GestureRootProps) {
  const [RootView, setRootView] = useState<
    React.ComponentType<GestureRootProps> | null
  >(null);

  useEffect(() => {
    if (isExpoGoNative()) return;

    void import("react-native-gesture-handler").then((mod) => {
      setRootView(() => mod.GestureHandlerRootView);
    });
  }, []);

  if (isExpoGoNative() || !RootView) {
    return <View style={style}>{children}</View>;
  }

  return <RootView style={style}>{children}</RootView>;
}
