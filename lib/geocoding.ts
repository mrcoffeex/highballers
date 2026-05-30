import { GeoPoint } from "./location";

const NOMINATIM_BASE = "https://nominatim.openstreetmap.org";
const USER_AGENT = "HighBallers/1.0 (pickup basketball app)";

export interface GeocodingResult {
  label: string;
  latitude: number;
  longitude: number;
}

interface NominatimResult {
  display_name: string;
  lat: string;
  lon: string;
}

async function nominatimFetch(path: string) {
  const response = await fetch(`${NOMINATIM_BASE}${path}`, {
    headers: {
      Accept: "application/json",
      "User-Agent": USER_AGENT,
    },
  });

  if (!response.ok) {
    throw new Error("Location search failed. Try again.");
  }

  return response.json() as Promise<NominatimResult[]>;
}

function toResult(row: NominatimResult): GeocodingResult {
  return {
    label: row.display_name,
    latitude: Number(row.lat),
    longitude: Number(row.lon),
  };
}

export async function searchPlaces(
  query: string,
  limit = 5,
): Promise<GeocodingResult[]> {
  const trimmed = query.trim();
  if (trimmed.length < 3) return [];

  const params = new URLSearchParams({
    q: trimmed,
    format: "json",
    addressdetails: "0",
    limit: String(limit),
  });

  const rows = await nominatimFetch(`/search?${params.toString()}`);
  return rows.map(toResult);
}

export async function reverseGeocode(
  point: GeoPoint,
): Promise<GeocodingResult> {
  const params = new URLSearchParams({
    lat: String(point.latitude),
    lon: String(point.longitude),
    format: "json",
  });

  const response = await fetch(
    `${NOMINATIM_BASE}/reverse?${params.toString()}`,
    {
      headers: {
        Accept: "application/json",
        "User-Agent": USER_AGENT,
      },
    },
  );

  if (!response.ok) {
    throw new Error("Could not resolve this location.");
  }

  const row = (await response.json()) as NominatimResult;

  if (!row?.display_name) {
    return {
      label: `${point.latitude.toFixed(5)}, ${point.longitude.toFixed(5)}`,
      latitude: point.latitude,
      longitude: point.longitude,
    };
  }

  return toResult(row);
}
