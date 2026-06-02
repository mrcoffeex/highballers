/** Prefix for GIF-only chat messages. */
export const CHAT_GIF_PREFIX = "hb-gif:";

const GIF_URL_PATTERN = /^https?:\/\/.+/i;
const GIPHY_ID_PATTERN = /^[a-zA-Z0-9]+$/;

export function giphyMediaUrl(giphyId: string): string {
  return `https://media.giphy.com/media/${giphyId}/giphy.gif`;
}

export function encodeGifMessage(input: string | { id: string }): string {
  if (typeof input === "object") {
    const id = input.id.trim();
    if (!GIPHY_ID_PATTERN.test(id)) {
      throw new Error("Invalid GIF id.");
    }
    return `${CHAT_GIF_PREFIX}i:${id}`;
  }

  const trimmed = input.trim();
  if (!GIF_URL_PATTERN.test(trimmed)) {
    throw new Error("Invalid GIF URL.");
  }
  return `${CHAT_GIF_PREFIX}${trimmed}`;
}

export function isGifMessage(body: string): boolean {
  return body.startsWith(CHAT_GIF_PREFIX);
}

export function getGifMessageUrl(body: string): string | null {
  if (!isGifMessage(body)) return null;

  const payload = body.slice(CHAT_GIF_PREFIX.length).trim();
  if (payload.startsWith("i:")) {
    const id = payload.slice(2).trim();
    if (!GIPHY_ID_PATTERN.test(id)) return null;
    return giphyMediaUrl(id);
  }

  return GIF_URL_PATTERN.test(payload) ? payload : null;
}

export function formatChatMessagePreview(body: string, maxLength = 72): string {
  if (isGifMessage(body)) return "GIF";

  const normalized = body.replace(/\s+/g, " ").trim();
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength - 1)}…`;
}
