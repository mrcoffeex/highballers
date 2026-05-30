import { describe, expect, it } from "vitest";

import {
  CHAT_GIF_PREFIX,
  encodeGifMessage,
  formatChatMessagePreview,
  getGifMessageUrl,
  isGifMessage,
} from "../chatMessageContent";

describe("chatMessageContent", () => {
  it("encodes and decodes GIF messages", () => {
    const url = "https://media.giphy.com/test.gif";
    const body = encodeGifMessage(url);
    expect(body).toBe(`${CHAT_GIF_PREFIX}${url}`);
    expect(isGifMessage(body)).toBe(true);
    expect(getGifMessageUrl(body)).toBe(url);
  });

  it("rejects invalid GIF URLs", () => {
    expect(() => encodeGifMessage("not-a-url")).toThrow("Invalid GIF URL");
  });

  it("formats previews", () => {
    expect(formatChatMessagePreview(`${CHAT_GIF_PREFIX}https://x.com/a.gif`)).toBe(
      "GIF",
    );
    expect(formatChatMessagePreview("  hello   world  ")).toBe("hello world");
    expect(formatChatMessagePreview("a".repeat(100), 10)).toBe("a".repeat(9) + "…");
  });
});
