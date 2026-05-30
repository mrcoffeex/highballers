import { Pressable, StyleSheet } from "react-native";
import MapView, { Marker, UrlTile } from "react-native-maps";

import { GeoPoint } from "../lib/location";
import { colors, radius } from "../lib/theme";

const OSM_TILE = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";

interface EventMapPreviewProps {
  location: GeoPoint;
  onPress?: () => void;
}

export function EventMapPreview({ location, onPress }: EventMapPreviewProps) {
  return (
    <Pressable onPress={onPress} style={styles.shell}>
      <MapView
        style={styles.map}
        region={{
          latitude: location.latitude,
          longitude: location.longitude,
          latitudeDelta: 0.012,
          longitudeDelta: 0.012,
        }}
        scrollEnabled={false}
        zoomEnabled={false}
        rotateEnabled={false}
        pitchEnabled={false}
        toolbarEnabled={false}
        pointerEvents="none"
      >
        <UrlTile urlTemplate={OSM_TILE} maximumZ={19} flipY={false} />
        <Marker coordinate={location} pinColor={colors.primary} />
      </MapView>
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
});
