import { Linking, Platform } from "react-native";

import { GeoPoint } from "./location";
import {
  getGoogleMapsDirectionsUrl,
  getGoogleMapsSearchUrl,
} from "./mapsUrls";

export {
  getGoogleMapsDirectionsUrl,
  getGoogleMapsSearchUrl,
  isValidGeoPoint,
} from "./mapsUrls";

async function openUrl(url: string) {
  if (Platform.OS === "web" && typeof window !== "undefined") {
    window.open(url, "_blank", "noopener,noreferrer");
    return;
  }

  const canOpen = await Linking.canOpenURL(url);
  if (!canOpen) {
    throw new Error("Could not open Google Maps on this device.");
  }

  await Linking.openURL(url);
}

/** Opens Google Maps with a pin at the game location. */
export async function openGoogleMapsPlace(point: GeoPoint, label?: string) {
  await openUrl(getGoogleMapsSearchUrl(point, label));
}

export async function openGoogleMapsDirections(
  point: GeoPoint,
  label?: string,
) {
  await openUrl(getGoogleMapsDirectionsUrl(point, label));
}

/** @deprecated Use openGoogleMapsDirections */
export async function openGoogleMaps(point: GeoPoint, label?: string) {
  return openGoogleMapsDirections(point, label);
}
