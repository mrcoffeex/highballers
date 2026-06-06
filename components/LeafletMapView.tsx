import { useEffect, useMemo, useRef } from "react";
import { StyleSheet, View } from "react-native";
import { WebView } from "react-native-webview";

import { buildLeafletMapHtml } from "../lib/leafletMap";
import { useTheme, useThemedStyles } from "../lib/ThemeProvider";
import { radius, type ThemeColors } from "../lib/theme";
import type { LeafletMapViewProps } from "./LeafletMapView.types";

export type { LeafletMapViewProps } from "./LeafletMapView.types";

export function LeafletMapView({
  center,
  height,
  interactive = false,
  showMarker = true,
  zoom = 14,
  markerColor,
  onMapPress,
  style,
}: LeafletMapViewProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const resolvedMarkerColor = markerColor ?? colors.primary;
  const webViewRef = useRef<WebView>(null);

  const html = useMemo(
    () =>
      buildLeafletMapHtml({
        latitude: center.latitude,
        longitude: center.longitude,
        zoom,
        interactive,
        markerColor: resolvedMarkerColor,
        showMarker,
      }),
    [
      center.latitude,
      center.longitude,
      interactive,
      resolvedMarkerColor,
      showMarker,
      zoom,
    ],
  );

  useEffect(() => {
    webViewRef.current?.injectJavaScript(
      `window.updateLeafletView && window.updateLeafletView(${center.latitude}, ${center.longitude}, ${zoom}); true;`,
    );
  }, [center.latitude, center.longitude, zoom]);

  return (
    <View style={[styles.shell, { height }, style]}>
      <WebView
        ref={webViewRef}
        originWhitelist={["*"]}
        source={{ html }}
        scrollEnabled={false}
        bounces={false}
        overScrollMode="never"
        nestedScrollEnabled={interactive}
        style={styles.webview}
        onMessage={(event) => {
          if (!onMapPress) return;

          try {
            const data = JSON.parse(event.nativeEvent.data) as {
              type?: string;
              latitude?: number;
              longitude?: number;
            };

            if (
              data.type === "click" &&
              typeof data.latitude === "number" &&
              typeof data.longitude === "number"
            ) {
              onMapPress({
                latitude: data.latitude,
                longitude: data.longitude,
              });
            }
          } catch {
            // Ignore malformed WebView messages.
          }
        }}
      />
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    shell: {
      borderRadius: radius.lg,
      overflow: "hidden",
      backgroundColor: colors.card,
    },
    webview: {
      flex: 1,
      backgroundColor: colors.card,
    },
  });
}
