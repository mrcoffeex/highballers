import { describe, expect, it } from "vitest";

import { buildLeafletMapHtml } from "../leafletMap";
import {
  getGoogleMapsDirectionsUrl,
  getGoogleMapsSearchUrl,
} from "../mapsUrls";

describe("buildLeafletMapHtml", () => {
  it("embeds leaflet assets and map coordinates", () => {
    const html = buildLeafletMapHtml({
      latitude: 14.5995,
      longitude: 120.9842,
      zoom: 15,
      interactive: true,
      markerColor: "#3B82F6",
      showMarker: true,
    });

    expect(html).toContain("leaflet@1.9.4");
    expect(html).toContain("14.5995");
    expect(html).toContain("120.9842");
    expect(html).toContain("ReactNativeWebView.postMessage");
  });
});

describe("getGoogleMapsDirectionsUrl", () => {
  it("uses lat,lng destination so Google Maps shows the pin", () => {
    expect(
      getGoogleMapsDirectionsUrl(
        { latitude: 14.5995, longitude: 120.9842 },
        "MOA Arena",
      ),
    ).toBe(
      "https://www.google.com/maps/dir/?api=1&travelmode=driving&destination=14.5995%2C120.9842",
    );
  });

  it("falls back to address label when coordinates are missing", () => {
    expect(
      getGoogleMapsDirectionsUrl(
        { latitude: 0, longitude: 0 },
        "MOA Arena, Manila",
      ),
    ).toBe(
      "https://www.google.com/maps/dir/?api=1&travelmode=driving&destination=MOA+Arena%2C+Manila",
    );
  });
});

describe("getGoogleMapsSearchUrl", () => {
  it("builds a search URL with coordinates for the map pin", () => {
    expect(
      getGoogleMapsSearchUrl(
        { latitude: 14.5995, longitude: 120.9842 },
        "MOA Arena",
      ),
    ).toBe(
      "https://www.google.com/maps/search/?api=1&query=14.5995%2C120.9842",
    );
  });
});
