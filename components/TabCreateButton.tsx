import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, View } from "react-native";

import { useTheme, useThemedStyles } from "../lib/ThemeProvider";
import { radius, type ThemeColors } from "../lib/theme";

import { TAB_ICON_SIZE, TAB_SLOT_SIZE } from "./TabBarIcon";

export function TabCreateIcon() {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.button}>
      <Ionicons name="add" size={TAB_ICON_SIZE} color={colors.onPrimary} />
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    button: {
      width: TAB_SLOT_SIZE,
      height: TAB_SLOT_SIZE,
      borderRadius: radius.lg,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
    },
  });
}
