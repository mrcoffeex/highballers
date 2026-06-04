import { GeoPoint } from "./location";

export function getGoogleMapsDirectionsUrl(point: GeoPoint, label?: string) {
  const destination = label
    ? encodeURIComponent(`${label}@${point.latitude},${point.longitude}`)
    : `${point.latitude},${point.longitude}`;

  return `https://www.google.com/maps/dir/?api=1&destination=${destination}`;
}
