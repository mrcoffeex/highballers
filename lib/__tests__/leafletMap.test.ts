import { describe, expect, it } from "vitest";

import { buildLeafletMapHtml } from "../leafletMap";
import { getGoogleMapsDirectionsUrl } from "../mapsUrls";

describe("buildLeafletMapHtml", () => {
  it("embeds leaflet assets and map coordinates", () => {
    const html = buildLeafletMapHtml({
      latitude: 14.5995,
      longitude: 120.9842,
      zoom: 15,
      interactive: true,
      markerColor: "#F0642F",
      showMarker: true,
    });

    expect(html).toContain("leaflet@1.9.4");
    expect(html).toContain("14.5995");
    expect(html).toContain("120.9842");
    expect(html).toContain("ReactNativeWebView.postMessage");
  });
});

describe("getGoogleMapsDirectionsUrl", () => {
  it("builds a Google Maps directions URL", () => {
    expect(
      getGoogleMapsDirectionsUrl(
        { latitude: 14.5995, longitude: 120.9842 },
        "MOA Arena",
      ),
    ).toBe(
      "https://www.google.com/maps/dir/?api=1&destination=MOA%20Arena%4014.5995%2C120.9842",
    );
  });
});
