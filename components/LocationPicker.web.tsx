import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import {
  GeocodingResult,
  reverseGeocode,
  searchPlaces,
} from "../lib/geocoding";
import { DEFAULT_MAP_CENTER, EventLocation, GeoPoint } from "../lib/location";
import { colors, radius, spacing, typography } from "../lib/theme";
import {
  Input,
  LocationPickerSkeleton,
  LocationResultsSkeleton,
  SkeletonInline,
} from "./ui";

export interface LocationPickerProps {
  value: EventLocation | null;
  onChange: (value: EventLocation) => void;
  placeholder?: string;
  initialCenter?: GeoPoint;
}

const OSM_TILE = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
const OSM_ATTRIBUTION = "© OpenStreetMap contributors";

export function LocationPicker({
  value,
  onChange,
  placeholder = "Search courts, gyms, parks...",
  initialCenter = DEFAULT_MAP_CENTER,
}: LocationPickerProps) {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<import("leaflet").Map | null>(null);
  const markerRef = useRef<import("leaflet").CircleMarker | null>(null);
  const leafletRef = useRef<typeof import("leaflet") | null>(null);

  const [query, setQuery] = useState(value?.label ?? "");
  const [results, setResults] = useState<GeocodingResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const center = useMemo(
    () => ({
      latitude: value?.latitude ?? initialCenter.latitude,
      longitude: value?.longitude ?? initialCenter.longitude,
    }),
    [
      initialCenter.latitude,
      initialCenter.longitude,
      value?.latitude,
      value?.longitude,
    ],
  );

  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

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

      leafletRef.current = leaflet;

      if (!mapInstanceRef.current) {
        const map = leaflet.map(mapRef.current, {
          center: [center.latitude, center.longitude],
          zoom: 14,
          zoomControl: false,
        });

        leaflet
          .tileLayer(OSM_TILE, {
            maxZoom: 19,
            attribution: OSM_ATTRIBUTION,
          })
          .addTo(map);

        map.on("click", async (event) => {
          setResolving(true);
          setSearchError(null);
          try {
            const resolved = await reverseGeocode({
              latitude: event.latlng.lat,
              longitude: event.latlng.lng,
            });
            onChangeRef.current(resolved);
            setQuery(resolved.label);
            setResults([]);
          } catch {
            setSearchError("Could not resolve that spot on the map.");
          } finally {
            setResolving(false);
          }
        });

        mapInstanceRef.current = map;
      }

      const map = mapInstanceRef.current;
      map.setView([center.latitude, center.longitude], map.getZoom());

      if (markerRef.current) {
        markerRef.current.setLatLng([center.latitude, center.longitude]);
      } else {
        markerRef.current = leaflet
          .circleMarker([center.latitude, center.longitude], {
            radius: 10,
            color: colors.primary,
            weight: 3,
            fillColor: colors.primary,
            fillOpacity: 0.85,
          })
          .addTo(map);
      }
    }

    initMap().catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [center.latitude, center.longitude]);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 3) {
      setResults([]);
      return;
    }

    const timeout = setTimeout(async () => {
      setSearching(true);
      setSearchError(null);
      try {
        const places = await searchPlaces(trimmed);
        setResults(places);
      } catch {
        setSearchError("Location search failed. Try again.");
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 350);

    return () => clearTimeout(timeout);
  }, [query]);

  const selectResult = (result: GeocodingResult) => {
    onChange(result);
    setQuery(result.label);
    setResults([]);
    mapInstanceRef.current?.setView([result.latitude, result.longitude], 15);
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchWrap}>
        <Ionicons
          name="search"
          size={18}
          color={colors.textDim}
          style={styles.searchIcon}
        />
        <Input
          value={query}
          onChangeText={setQuery}
          placeholder={placeholder}
          style={styles.searchInput}
        />
        {searching || resolving ? (
          <SkeletonInline size={18} style={styles.searchSpinner} />
        ) : null}
      </View>

      {searchError ? <Text style={styles.error}>{searchError}</Text> : null}

      {searching && results.length === 0 ? (
        <LocationResultsSkeleton count={3} />
      ) : null}

      {results.length > 0 ? (
        <View style={styles.results}>
          {results.map((result) => (
            <Pressable
              key={`${result.latitude}-${result.longitude}-${result.label}`}
              onPress={() => selectResult(result)}
              style={styles.resultRow}
            >
              <Ionicons
                name="location-outline"
                size={16}
                color={colors.primary}
              />
              <Text style={styles.resultText} numberOfLines={2}>
                {result.label}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : null}

      <View style={styles.mapShell}>
        {resolving ? (
          <View style={styles.mapOverlay}>
            <LocationPickerSkeleton />
          </View>
        ) : null}
        <div ref={mapRef} style={{ width: "100%", height: 240 }} />
        <View style={styles.mapHint}>
          <Ionicons
            name="hand-left-outline"
            size={14}
            color={colors.textMuted}
          />
          <Text style={styles.mapHintText}>Tap the map to drop a pin</Text>
        </View>
      </View>

      {value ? (
        <View style={styles.selectedRow}>
          <Ionicons name="navigate" size={16} color={colors.success} />
          <View style={styles.selectedCopy}>
            <Text style={styles.selectedLabel}>Selected court</Text>
            <Text style={styles.selectedValue} numberOfLines={2}>
              {value.label}
            </Text>
            <Text style={styles.coords}>
              {value.latitude.toFixed(5)}, {value.longitude.toFixed(5)}
            </Text>
          </View>
        </View>
      ) : (
        <Text style={styles.helper}>
          Search for a place or tap the map to set the game location.
        </Text>
      )}

      <Text style={styles.attribution}>{OSM_ATTRIBUTION}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  searchWrap: {
    position: "relative",
    justifyContent: "center",
  },
  searchIcon: {
    position: "absolute",
    left: spacing.md,
    zIndex: 1,
  },
  searchInput: {
    paddingLeft: spacing.xl + spacing.sm,
    paddingRight: spacing.xl,
  },
  searchSpinner: {
    position: "absolute",
    right: spacing.md,
  },
  error: {
    ...typography.caption,
    color: colors.error,
  },
  results: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: radius.lg,
    overflow: "hidden",
  },
  resultRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBorder,
  },
  resultText: {
    ...typography.caption,
    color: colors.text,
    flex: 1,
  },
  mapShell: {
    borderRadius: radius.lg,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.cardBorder,
    backgroundColor: colors.card,
    position: "relative",
  },
  mapOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: `${colors.background}CC`,
    zIndex: 2,
    padding: spacing.md,
    justifyContent: "center",
  },
  mapHint: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
  },
  mapHintText: {
    ...typography.caption,
    color: colors.textMuted,
  },
  selectedRow: {
    flexDirection: "row",
    gap: spacing.sm,
    backgroundColor: `${colors.success}12`,
    borderWidth: 1,
    borderColor: `${colors.success}40`,
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  selectedCopy: {
    flex: 1,
    gap: 2,
  },
  selectedLabel: {
    ...typography.label,
    color: colors.success,
    fontSize: 10,
  },
  selectedValue: {
    ...typography.body,
    color: colors.text,
    fontSize: 14,
  },
  coords: {
    ...typography.caption,
    color: colors.textDim,
  },
  helper: {
    ...typography.caption,
    color: colors.textDim,
  },
  attribution: {
    ...typography.caption,
    color: colors.textDim,
    fontSize: 10,
  },
});
