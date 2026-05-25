import { useEffect, useRef } from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { GeoPoint } from '../lib/location';
import { colors, radius } from '../lib/theme';

const OSM_TILE = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

interface EventMapPreviewProps {
  location: GeoPoint;
  onPress?: () => void;
}

export function EventMapPreview({ location, onPress }: EventMapPreviewProps) {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<import('leaflet').Map | null>(null);
  const markerRef = useRef<import('leaflet').CircleMarker | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function initMap() {
      if (typeof document !== 'undefined' && !document.getElementById('leaflet-css')) {
        const link = document.createElement('link');
        link.id = 'leaflet-css';
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
      }

      const leaflet = await import('leaflet');
      if (cancelled || !mapRef.current) return;

      if (!mapInstanceRef.current) {
        const map = leaflet.map(mapRef.current, {
          center: [location.latitude, location.longitude],
          zoom: 15,
          zoomControl: false,
          dragging: false,
          scrollWheelZoom: false,
          doubleClickZoom: false,
          touchZoom: false,
        });

        leaflet.tileLayer(OSM_TILE, {
          maxZoom: 19,
          attribution: '© OpenStreetMap',
        }).addTo(map);

        mapInstanceRef.current = map;
      }

      const map = mapInstanceRef.current;
      map.setView([location.latitude, location.longitude], 15);

      if (markerRef.current) {
        markerRef.current.setLatLng([location.latitude, location.longitude]);
      } else {
        markerRef.current = leaflet.circleMarker([location.latitude, location.longitude], {
          radius: 10,
          color: colors.primary,
          weight: 3,
          fillColor: colors.primary,
          fillOpacity: 0.9,
        }).addTo(map);
      }
    }

    initMap().catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [location.latitude, location.longitude]);

  return (
    <Pressable onPress={onPress} style={styles.shell}>
      <div ref={mapRef} style={{ width: '100%', height: 180 }} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  shell: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.cardBorder,
    backgroundColor: colors.card,
  },
});
