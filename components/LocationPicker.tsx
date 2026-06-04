import { Ionicons } from "@expo/vector-icons";
import * as ExpoLocation from "expo-location";
import { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import {
  GeocodingResult,
  reverseGeocode,
  searchPlaces,
} from "../lib/geocoding";
import { DEFAULT_MAP_CENTER, EventLocation, GeoPoint } from "../lib/location";
import { OSM_ATTRIBUTION } from "../lib/leafletMap";
import { colors, radius, spacing, typography } from "../lib/theme";
import { LeafletMapView } from "./LeafletMapView";
import {
  Button,
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

export function LocationPicker({
  value,
  onChange,
  placeholder = "Search courts, gyms, parks...",
  initialCenter = DEFAULT_MAP_CENTER,
}: LocationPickerProps) {
  const [query, setQuery] = useState(value?.label ?? "");
  const [results, setResults] = useState<GeocodingResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const mapCenter = useMemo(
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
  };

  const handleMapPress = async (point: GeoPoint) => {
    setResolving(true);
    setSearchError(null);
    try {
      const resolved = await reverseGeocode(point);
      onChange(resolved);
      setQuery(resolved.label);
      setResults([]);
    } catch {
      setSearchError("Could not resolve that spot on the map.");
    } finally {
      setResolving(false);
    }
  };

  const useCurrentLocation = async () => {
    setResolving(true);
    setSearchError(null);
    try {
      const permission = await ExpoLocation.requestForegroundPermissionsAsync();
      if (!permission.granted) {
        setSearchError(
          "Location permission is required to use your current position.",
        );
        return;
      }

      const position = await ExpoLocation.getCurrentPositionAsync({});
      await handleMapPress({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });
    } catch {
      setSearchError("Could not read your current location.");
    } finally {
      setResolving(false);
    }
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

      <Button
        title="Use My Location"
        variant="outline"
        size="sm"
        onPress={useCurrentLocation}
        icon={
          <Ionicons name="locate-outline" size={16} color={colors.primary} />
        }
      />

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
        <LeafletMapView
          center={mapCenter}
          height={240}
          interactive
          showMarker={Boolean(value)}
          zoom={value ? 15 : 14}
          onMapPress={handleMapPress}
        />
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
          Search, use your location, or tap the map to set the game spot.
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
    ...StyleSheet.absoluteFillObject,
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
