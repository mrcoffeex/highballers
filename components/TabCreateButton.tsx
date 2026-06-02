import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import {
  Platform,
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";

import { useTheme, useThemedStyles } from "../lib/ThemeProvider";
import { radius, shadows, spacing, type ThemeColors } from "../lib/theme";

interface TabCreateButtonProps {
  onPressCreate: () => void;
  style?: StyleProp<ViewStyle>;
}

export function TabCreateButton({
  onPressCreate,
  style,
}: TabCreateButtonProps) {
  const { colors, isDark } = useTheme();
  const styles = useThemedStyles(createStyles);

  const handlePress = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(
        () => undefined,
      );
    }
    onPressCreate();
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Create"
      onPress={handlePress}
      style={[styles.wrap, style]}
    >
      <View
        style={[
          styles.fab,
          { borderColor: isDark ? colors.surface : colors.background },
        ]}
      >
        <Ionicons name="add" size={30} color={colors.onPrimary} />
      </View>
    </Pressable>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    wrap: {
      flex: 1,
      alignItems: "center",
      justifyContent: "flex-start",
      paddingTop: spacing.xs,
    },
    fab: {
      width: 56,
      height: 56,
      borderRadius: radius.full,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
      marginTop: -spacing.lg,
      borderWidth: 3,
      ...shadows.card,
    },
  });
}
