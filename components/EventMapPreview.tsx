import { Image, Pressable, StyleSheet, View } from "react-native";

import { GeoPoint } from "../lib/location";
import { getOsmStaticMapUrl } from "../lib/maps";
import { colors, radius } from "../lib/theme";

interface EventMapPreviewProps {
  location: GeoPoint;
  onPress?: () => void;
}

export function EventMapPreview({ location, onPress }: EventMapPreviewProps) {
  const mapUrl = getOsmStaticMapUrl(location);

  return (
    <Pressable onPress={onPress} style={styles.shell}>
      <Image source={{ uri: mapUrl }} style={styles.map} resizeMode="cover" />
      <View pointerEvents="none" style={styles.marker} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  shell: {
    borderRadius: radius.lg,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.cardBorder,
    backgroundColor: colors.card,
  },
  map: {
    width: "100%",
    height: 180,
  },
  marker: {
    position: "absolute",
    left: "50%",
    top: "50%",
    width: 18,
    height: 18,
    marginLeft: -9,
    marginTop: -9,
    borderRadius: 9,
    borderWidth: 3,
    borderColor: colors.text,
    backgroundColor: colors.primary,
  },
});
