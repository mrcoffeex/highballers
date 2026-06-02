const GIPHY_API = "https://api.giphy.com/v1/gifs";

export interface GiphyGif {
  id: string;
  previewUrl: string;
  fullUrl: string;
  title: string;
}

function getApiKey(): string | undefined {
  const key = process.env.EXPO_PUBLIC_GIPHY_API_KEY?.trim();
  return key || undefined;
}

export function isGiphyConfigured(): boolean {
  return Boolean(getApiKey());
}

function mapGif(item: {
  id: string;
  title?: string;
  images: {
    fixed_width_small?: { url?: string };
    fixed_height_small?: { url?: string };
    downsized_medium?: { url?: string };
    downsized?: { url?: string };
    original?: { url?: string };
  };
}): GiphyGif | null {
  const previewUrl =
    item.images.fixed_width_small?.url ??
    item.images.fixed_height_small?.url ??
    item.images.downsized?.url ??
    item.images.original?.url;
  const fullUrl =
    item.images.downsized_medium?.url ??
    item.images.downsized?.url ??
    item.images.original?.url ??
    previewUrl;
  if (!previewUrl || !fullUrl) return null;

  return {
    id: item.id,
    previewUrl: previewUrl.replace(/^http:\/\//i, "https://"),
    fullUrl: fullUrl.replace(/^http:\/\//i, "https://"),
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
    meta?: { msg?: string };
    data?: Array<{
      id: string;
      title?: string;
      images: {
        fixed_width_small?: { url?: string };
        fixed_height_small?: { url?: string };
        downsized_medium?: { url?: string };
        downsized?: { url?: string };
        original?: { url?: string };
      };
    }>;
  };

  if (!response.ok) {
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
