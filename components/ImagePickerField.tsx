import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { Image } from "expo-image";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Avatar } from "./ui";
import { colors, radius, spacing, typography } from "../lib/theme";

interface ImagePickerFieldProps {
  label: string;
  imageUri?: string;
  fallbackName: string;
  fallbackColor: string;
  shape?: "circle" | "rounded";
  size?: number;
  onPick: (uri: string) => void;
}

export function ImagePickerField({
  label,
  imageUri,
  fallbackName,
  fallbackColor,
  shape = "circle",
  size = 96,
  onPick,
}: ImagePickerFieldProps) {
  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: shape === "circle" ? [1, 1] : [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]?.uri) {
      onPick(result.assets[0].uri);
    }
  };

  const borderRadius = shape === "circle" ? size / 2 : radius.lg;

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <Pressable onPress={pickImage} style={styles.row}>
        {imageUri ? (
          <Image
            source={{ uri: imageUri }}
            style={{ width: size, height: size, borderRadius }}
          />
        ) : (
          <Avatar name={fallbackName} color={fallbackColor} size={size} />
        )}
        <View style={styles.copy}>
          <Text style={styles.title}>
            {imageUri ? "Change photo" : "Add photo"}
          </Text>
          <Text style={styles.subtitle}>Choose from your library</Text>
        </View>
        <Ionicons name="camera-outline" size={22} color={colors.primary} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  label: {
    ...typography.label,
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  copy: {
    flex: 1,
  },
  title: {
    ...typography.heading,
    color: colors.text,
    fontSize: 16,
  },
  subtitle: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 2,
  },
});
