import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { StyleSheet, View } from "react-native";

import { radius, withAlpha } from "../lib/theme";

interface ClubIconProps {
  name: string;
  iconColor: string;
  iconUrl?: string;
  size?: number;
}

export function ClubIcon({
  name,
  iconColor,
  iconUrl,
  size = 48,
}: ClubIconProps) {
  if (iconUrl) {
    return (
      <Image
        source={{ uri: iconUrl }}
        style={{ width: size, height: size, borderRadius: radius.lg }}
        contentFit="cover"
      />
    );
  }

  return (
    <View
      style={[
        styles.icon,
        {
          width: size,
          height: size,
          backgroundColor: withAlpha(iconColor, 0.13),
        },
      ]}
    >
      <Ionicons name="basketball" size={size * 0.5} color={iconColor} />
    </View>
  );
}

const styles = StyleSheet.create({
  icon: {
    borderRadius: radius.lg,
    alignItems: "center",
    justifyContent: "center",
  },
});
