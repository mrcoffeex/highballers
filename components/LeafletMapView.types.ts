import { GeoPoint } from "../lib/location";
import type { ViewStyle } from "react-native";

export type LeafletMapViewProps = {
  center: GeoPoint;
  height: number;
  interactive?: boolean;
  showMarker?: boolean;
  zoom?: number;
  markerColor?: string;
  onMapPress?: (point: GeoPoint) => void;
  style?: ViewStyle;
};
