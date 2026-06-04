import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

import { EventLocation } from "../lib/location";
import {
  openGoogleMapsDirections,
  openGoogleMapsPlace,
} from "../lib/maps";
import { colors, spacing, typography } from "../lib/theme";
import { EventMapPreview } from "./EventMapPreview";
import { Button } from "./ui";

interface EventLocationCardProps {
  location: EventLocation;
}

export function EventLocationCard({ location }: EventLocationCardProps) {
  const openPlace = () => openGoogleMapsPlace(location, location.label);
  const openDirections = () =>
    openGoogleMapsDirections(location, location.label);

  return (
    <View style={styles.container}>
      <EventMapPreview location={location} onPress={openPlace} />

      <View style={styles.copy}>
        <View style={styles.labelRow}>
          <Ionicons name="location-outline" size={16} color={colors.primary} />
          <Text style={styles.label}>Game location</Text>
        </View>
        <Text style={styles.address}>{location.label}</Text>
        <Text style={styles.coords}>
          {location.latitude.toFixed(5)}, {location.longitude.toFixed(5)}
        </Text>
      </View>

      <Button
        title="Get directions"
        variant="outline"
        onPress={openDirections}
        icon={<Ionicons name="navigate-outline" size={18} color={colors.primary} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  copy: {
    gap: spacing.xs,
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  label: {
    ...typography.label,
    color: colors.textMuted,
    fontSize: 10,
  },
  address: {
    ...typography.body,
    color: colors.text,
    fontSize: 15,
  },
  coords: {
    ...typography.caption,
    color: colors.textDim,
  },
});
