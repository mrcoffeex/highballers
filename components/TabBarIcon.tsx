import { ReactNode } from "react";
import { StyleSheet, View } from "react-native";

import { radius } from "../lib/theme";

export const TAB_ICON_SIZE = 22;
export const TAB_SLOT_SIZE = 36;

interface TabBarIconProps {
  children: ReactNode;
}

export function TabBarIcon({ children }: TabBarIconProps) {
  return <View style={styles.slot}>{children}</View>;
}

const styles = StyleSheet.create({
  slot: {
    width: TAB_SLOT_SIZE,
    height: TAB_SLOT_SIZE,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
});
