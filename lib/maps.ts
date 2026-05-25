import { Linking, Platform } from 'react-native';

import { GeoPoint } from './location';

export function getGoogleMapsUrl(point: GeoPoint, label?: string) {
  const query = label
    ? encodeURIComponent(`${label}@${point.latitude},${point.longitude}`)
    : `${point.latitude},${point.longitude}`;

  return `https://www.google.com/maps/search/?api=1&query=${query}`;
}

export function getOsmStaticMapUrl(point: GeoPoint, width = 640, height = 280) {
  const { latitude, longitude } = point;
  return `https://static-maps.openstreetmap.de/staticmap.php?center=${latitude},${longitude}&zoom=15&size=${width}x${height}&markers=${latitude},${longitude},red-pushpin`;
}

export async function openGoogleMaps(point: GeoPoint, label?: string) {
  const url = getGoogleMapsUrl(point, label);

  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    window.open(url, '_blank', 'noopener,noreferrer');
    return;
  }

  await Linking.openURL(url);
}
