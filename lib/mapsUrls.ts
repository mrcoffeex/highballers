import { GeoPoint } from "./location";

/** True when coordinates are usable for Maps URLs. */
export function isValidGeoPoint(point: GeoPoint): boolean {
  const { latitude: lat, longitude: lng } = point;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false;
  if (lat === 0 && lng === 0) return false;
  return Math.abs(lat) <= 90 && Math.abs(lng) <= 180;
}

function formatCoordinates(point: GeoPoint): string {
  return `${point.latitude},${point.longitude}`;
}

/**
 * Opens Google Maps with a pin at the location (Search action).
 * @see https://developers.google.com/maps/documentation/urls/get-started#search-action
 */
export function getGoogleMapsSearchUrl(point: GeoPoint, label?: string) {
  const params = new URLSearchParams({ api: "1" });

  if (isValidGeoPoint(point)) {
    params.set("query", formatCoordinates(point));
  } else if (label?.trim()) {
    params.set("query", label.trim());
  } else {
    throw new Error("A valid location is required to open Google Maps.");
  }

  return `https://www.google.com/maps/search/?${params.toString()}`;
}

/**
 * Opens Google Maps directions to the destination.
 * Use comma-separated lat,lng so the destination pin is placed reliably.
 * @see https://developers.google.com/maps/documentation/urls/get-started#directions-action
 */
export function getGoogleMapsDirectionsUrl(point: GeoPoint, label?: string) {
  const params = new URLSearchParams({
    api: "1",
    travelmode: "driving",
  });

  if (isValidGeoPoint(point)) {
    params.set("destination", formatCoordinates(point));
  } else if (label?.trim()) {
    params.set("destination", label.trim());
  } else {
    throw new Error("A valid location is required for directions.");
  }

  return `https://www.google.com/maps/dir/?${params.toString()}`;
}
