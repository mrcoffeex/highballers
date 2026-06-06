export const LEAFLET_VERSION = "1.9.4";

export const OSM_TILE_URL =
  "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

export const OSM_ATTRIBUTION = "© OpenStreetMap contributors";

export type LeafletMapHtmlOptions = {
  latitude: number;
  longitude: number;
  zoom: number;
  interactive: boolean;
  markerColor: string;
  showMarker: boolean;
};

export function buildLeafletMapHtml(options: LeafletMapHtmlOptions): string {
  const { latitude, longitude, zoom, interactive, markerColor, showMarker } =
    options;
  const interactionFlag = interactive ? "true" : "false";

  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta
      name="viewport"
      content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no"
    />
    <link
      rel="stylesheet"
      href="https://unpkg.com/leaflet@${LEAFLET_VERSION}/dist/leaflet.css"
    />
    <script src="https://unpkg.com/leaflet@${LEAFLET_VERSION}/dist/leaflet.js"></script>
    <style>
      html,
      body,
      #map {
        height: 100%;
        width: 100%;
        margin: 0;
        padding: 0;
        background: #1f2937;
      }
      .leaflet-control-attribution {
        font-size: 9px;
      }
    </style>
  </head>
  <body>
    <div id="map"></div>
    <script>
      const map = L.map("map", {
        zoomControl: false,
        dragging: ${interactionFlag},
        scrollWheelZoom: ${interactionFlag},
        doubleClickZoom: ${interactionFlag},
        touchZoom: ${interactionFlag},
        boxZoom: false,
        keyboard: false,
      }).setView([${latitude}, ${longitude}], ${zoom});

      L.tileLayer("${OSM_TILE_URL}", {
        maxZoom: 19,
        attribution: "${OSM_ATTRIBUTION}",
      }).addTo(map);

      let marker = null;

      function setMarker(lat, lng) {
        if (marker) {
          marker.setLatLng([lat, lng]);
          return;
        }
        marker = L.circleMarker([lat, lng], {
          radius: 10,
          color: "${markerColor}",
          weight: 3,
          fillColor: "${markerColor}",
          fillOpacity: 0.85,
        }).addTo(map);
      }

      window.updateLeafletView = function updateLeafletView(lat, lng, nextZoom) {
        map.setView([lat, lng], nextZoom || map.getZoom());
        if (${showMarker ? "true" : "false"}) {
          setMarker(lat, lng);
        }
      };

      if (${showMarker ? "true" : "false"}) {
        setMarker(${latitude}, ${longitude});
      }

      ${
        interactive
          ? `map.on("click", function (event) {
        setMarker(event.latlng.lat, event.latlng.lng);
        if (window.ReactNativeWebView) {
          window.ReactNativeWebView.postMessage(
            JSON.stringify({
              type: "click",
              latitude: event.latlng.lat,
              longitude: event.latlng.lng,
            }),
          );
        }
      });`
          : ""
      }
    </script>
  </body>
</html>`;
}
