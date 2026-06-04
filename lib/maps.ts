import { Linking, Platform } from "react-native";

import { GeoPoint } from "./location";
import { getGoogleMapsDirectionsUrl } from "./mapsUrls";

export { getGoogleMapsDirectionsUrl } from "./mapsUrls";

export async function openGoogleMapsDirections(
  point: GeoPoint,
  label?: string,
) {
  const url = getGoogleMapsDirectionsUrl(point, label);

  if (Platform.OS === "web" && typeof window !== "undefined") {
    window.open(url, "_blank", "noopener,noreferrer");
    return;
  }

  await Linking.openURL(url);
}

/** @deprecated Use openGoogleMapsDirections */
export async function openGoogleMaps(point: GeoPoint, label?: string) {
  return openGoogleMapsDirections(point, label);
}
