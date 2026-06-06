import { Pressable, StyleSheet } from "react-native";

import { GeoPoint } from "../lib/location";
import { useThemedStyles } from "../lib/ThemeProvider";
import { radius, type ThemeColors } from "../lib/theme";
import { LeafletMapView } from "./LeafletMapView";

interface EventMapPreviewProps {
  location: GeoPoint;
  onPress?: () => void;
}

export function EventMapPreview({ location, onPress }: EventMapPreviewProps) {
  const styles = useThemedStyles(createStyles);

  return (
    <Pressable onPress={onPress} style={styles.shell}>
      <LeafletMapView
        center={location}
        height={180}
        interactive={false}
        showMarker
        zoom={15}
      />
    </Pressable>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    shell: {
      borderRadius: radius.lg,
      overflow: "hidden",
      borderWidth: 1,
      borderColor: colors.cardBorder,
      backgroundColor: colors.card,
    },
  });
}
