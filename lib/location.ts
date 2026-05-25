export interface GeoPoint {
  latitude: number;
  longitude: number;
}

export interface EventLocation extends GeoPoint {
  label: string;
}

export const DEFAULT_MAP_CENTER: GeoPoint = {
  latitude: 40.758,
  longitude: -73.9855,
};
