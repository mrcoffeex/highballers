import Constants from "expo-constants";

const GIPHY_API = "https://api.giphy.com/v1/gifs";

export interface GiphyGif {
  id: string;
  previewUrl: string;
  fullUrl: string;
  title: string;
}

function getApiKey(): string | undefined {
  const fromEnv = process.env.EXPO_PUBLIC_GIPHY_API_KEY?.trim();
  if (fromEnv) return fromEnv;

  const fromExtra = Constants.expoConfig?.extra?.giphyApiKey;
  if (typeof fromExtra === "string" && fromExtra.trim()) {
    return fromExtra.trim();
  }

  return undefined;
}

export function isGiphyConfigured(): boolean {
  return Boolean(getApiKey());
}

function toHttps(url: string): string {
  return url.replace(/^http:\/\//i, "https://");
}

function pickImageUrl(
  ...candidates: Array<{ url?: string } | undefined>
): string | undefined {
  for (const candidate of candidates) {
    const url = candidate?.url?.trim();
    if (url) return toHttps(url);
  }
  return undefined;
}

function mapGif(item: {
  id: string;
  title?: string;
  images: {
    preview_gif?: { url?: string };
    fixed_width_small?: { url?: string };
    fixed_height_small?: { url?: string };
    fixed_width?: { url?: string };
    downsized_medium?: { url?: string };
    downsized?: { url?: string };
    original?: { url?: string };
  };
}): GiphyGif | null {
  const previewUrl = pickImageUrl(
    item.images.preview_gif,
    item.images.fixed_width_small,
    item.images.fixed_height_small,
    item.images.downsized,
    item.images.original,
  );
  const fullUrl = pickImageUrl(
    item.images.downsized_medium,
    item.images.downsized,
    item.images.fixed_width,
    item.images.original,
    item.images.preview_gif,
    item.images.fixed_width_small,
    item.images.fixed_height_small,
  );
  if (!previewUrl || !fullUrl) return null;

  return {
    id: item.id,
    previewUrl,
    fullUrl,
    title: item.title?.trim() || "GIF",
  };
}

async function fetchGiphy(path: string, params: Record<string, string>) {
  const apiKey = getApiKey();
  if (!apiKey) return [];

  const query = new URLSearchParams({
    api_key: apiKey,
    limit: "24",
    rating: "pg-13",
    ...params,
  });

  const response = await fetch(`${GIPHY_API}${path}?${query}`);
  const json = (await response.json()) as {
    meta?: { status?: number; msg?: string };
    data?: Array<{
      id: string;
      title?: string;
      images: {
        preview_gif?: { url?: string };
        fixed_width_small?: { url?: string };
        fixed_height_small?: { url?: string };
        fixed_width?: { url?: string };
        downsized_medium?: { url?: string };
        downsized?: { url?: string };
        original?: { url?: string };
      };
    }>;
  };

  const apiStatus = json.meta?.status;
  if (!response.ok || (apiStatus != null && apiStatus !== 200)) {
    throw new Error(json.meta?.msg || "Could not load GIFs right now.");
  }

  return (json.data ?? [])
    .map((item) => mapGif(item))
    .filter((gif): gif is GiphyGif => gif !== null);
}

export function fetchTrendingGifs() {
  return fetchGiphy("/trending", {});
}

export function searchGifs(term: string) {
  const q = term.trim();
  if (!q) return fetchTrendingGifs();
  return fetchGiphy("/search", { q });
}
