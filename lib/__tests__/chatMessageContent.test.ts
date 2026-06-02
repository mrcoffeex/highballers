import { describe, expect, it } from "vitest";

import {
  CHAT_GIF_PREFIX,
  encodeGifMessage,
  formatChatMessagePreview,
  getGifMessageUrl,
  giphyMediaUrl,
  isGifMessage,
} from "../chatMessageContent";

describe("chatMessageContent", () => {
  it("encodes and decodes GIF messages by GIPHY id", () => {
    const body = encodeGifMessage({ id: "Sf3k4BqkaVaTgt9DZT" });
    expect(body).toBe(`${CHAT_GIF_PREFIX}i:Sf3k4BqkaVaTgt9DZT`);
    expect(isGifMessage(body)).toBe(true);
    expect(getGifMessageUrl(body)).toBe(giphyMediaUrl("Sf3k4BqkaVaTgt9DZT"));
  });

  it("encodes and decodes legacy full-URL GIF messages", () => {
    const url = "https://media.giphy.com/test.gif";
    const body = encodeGifMessage(url);
    expect(body).toBe(`${CHAT_GIF_PREFIX}${url}`);
    expect(isGifMessage(body)).toBe(true);
    expect(getGifMessageUrl(body)).toBe(url);
  });

  it("rejects invalid GIF URLs", () => {
    expect(() => encodeGifMessage("not-a-url")).toThrow("Invalid GIF URL");
    expect(() => encodeGifMessage({ id: "bad id!" })).toThrow("Invalid GIF id");
  });

  it("formats previews", () => {
    expect(formatChatMessagePreview(`${CHAT_GIF_PREFIX}i:abc123`)).toBe("GIF");
    expect(formatChatMessagePreview(`${CHAT_GIF_PREFIX}https://x.com/a.gif`)).toBe(
      "GIF",
    );
    expect(formatChatMessagePreview("  hello   world  ")).toBe("hello world");
    expect(formatChatMessagePreview("a".repeat(100), 10)).toBe("a".repeat(9) + "…");
  });
});
