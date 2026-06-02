import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("expo-constants", () => ({
  default: {
    expoConfig: {
      extra: {},
    },
  },
}));

import { fetchTrendingGifs, isGiphyConfigured } from "../giphy";

describe("giphy", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.EXPO_PUBLIC_GIPHY_API_KEY;
  });

  it("reports configured when API key is set", () => {
    process.env.EXPO_PUBLIC_GIPHY_API_KEY = " test-key ";
    expect(isGiphyConfigured()).toBe(true);
  });

  it("maps API results and surfaces API meta errors", async () => {
    process.env.EXPO_PUBLIC_GIPHY_API_KEY = "test-key";

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => ({
          meta: { status: 200, msg: "OK" },
          data: [
            {
              id: "abc",
              title: "Wave",
              images: {
                preview_gif: { url: "http://media.giphy.com/preview.gif" },
                downsized_medium: { url: "http://media.giphy.com/full.gif" },
              },
            },
          ],
        }),
      })),
    );

    const gifs = await fetchTrendingGifs();
    expect(gifs).toEqual([
      {
        id: "abc",
        previewUrl: "https://media.giphy.com/preview.gif",
        fullUrl: "https://media.giphy.com/full.gif",
        title: "Wave",
      },
    ]);
  });

  it("throws when GIPHY returns a non-200 meta status", async () => {
    process.env.EXPO_PUBLIC_GIPHY_API_KEY = "bad-key";

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: false,
        json: async () => ({
          meta: { status: 401, msg: "Unauthorized" },
          data: [],
        }),
      })),
    );

    await expect(fetchTrendingGifs()).rejects.toThrow("Unauthorized");
  });
});
