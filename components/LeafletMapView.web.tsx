import { useEffect, useRef } from "react";
import { StyleSheet, View, type ViewStyle } from "react-native";

import { OSM_ATTRIBUTION, OSM_TILE_URL } from "../lib/leafletMap";
import { GeoPoint } from "../lib/location";
import { useTheme, useThemedStyles } from "../lib/ThemeProvider";
import { radius, type ThemeColors } from "../lib/theme";
import type { LeafletMapViewProps } from "./LeafletMapView.types";

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
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<import("leaflet").Map | null>(null);
  const markerRef = useRef<import("leaflet").CircleMarker | null>(null);
  const onMapPressRef = useRef(onMapPress);
  onMapPressRef.current = onMapPress;

  useEffect(() => {
    let cancelled = false;

    async function initMap() {
      if (
        typeof document !== "undefined" &&
        !document.getElementById("leaflet-css")
      ) {
        const link = document.createElement("link");
        link.id = "leaflet-css";
        link.rel = "stylesheet";
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
        document.head.appendChild(link);
      }

      const leaflet = await import("leaflet");
      if (cancelled || !mapRef.current) return;

      if (!mapInstanceRef.current) {
        const map = leaflet.map(mapRef.current, {
          center: [center.latitude, center.longitude],
          zoom,
          zoomControl: false,
          dragging: interactive,
          scrollWheelZoom: interactive,
          doubleClickZoom: interactive,
          touchZoom: interactive,
        });

        leaflet
          .tileLayer(OSM_TILE_URL, {
            maxZoom: 19,
            attribution: OSM_ATTRIBUTION,
          })
          .addTo(map);

        if (interactive) {
          map.on("click", (event) => {
            const { lat, lng } = event.latlng;
            if (markerRef.current) {
              markerRef.current.setLatLng([lat, lng]);
            } else {
              markerRef.current = leaflet
                .circleMarker([lat, lng], {
                  radius: 10,
                  color: resolvedMarkerColor,
                  weight: 3,
                  fillColor: resolvedMarkerColor,
                  fillOpacity: 0.85,
                })
                .addTo(map);
            }
            onMapPressRef.current?.({
              latitude: lat,
              longitude: lng,
            });
          });
        }

        mapInstanceRef.current = map;
      }

      const map = mapInstanceRef.current;
      map.setView([center.latitude, center.longitude], zoom);

      if (!showMarker) {
        markerRef.current?.remove();
        markerRef.current = null;
        return;
      }

      if (markerRef.current) {
        markerRef.current.setLatLng([center.latitude, center.longitude]);
      } else {
        markerRef.current = leaflet
          .circleMarker([center.latitude, center.longitude], {
            radius: 10,
            color: resolvedMarkerColor,
            weight: 3,
            fillColor: resolvedMarkerColor,
            fillOpacity: 0.85,
          })
          .addTo(map);
      }
    }

    void initMap();

    return () => {
      cancelled = true;
    };
  }, [
    center.latitude,
    center.longitude,
    interactive,
    resolvedMarkerColor,
    showMarker,
    zoom,
  ]);

  return (
    <View style={[styles.shell, { height }, style]}>
      <div ref={mapRef} style={{ width: "100%", height: "100%" }} />
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
  });
}
