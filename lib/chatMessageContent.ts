/** Prefix for GIF-only chat messages (body = prefix + HTTPS URL). */
export const CHAT_GIF_PREFIX = "hb-gif:";

const GIF_URL_PATTERN = /^https?:\/\/.+/i;

export function encodeGifMessage(url: string): string {
  const trimmed = url.trim();
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
  const url = body.slice(CHAT_GIF_PREFIX.length).trim();
  return GIF_URL_PATTERN.test(url) ? url : null;
}

export function formatChatMessagePreview(body: string, maxLength = 72): string {
  if (isGifMessage(body)) return "GIF";

  const normalized = body.replace(/\s+/g, " ").trim();
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength - 1)}…`;
}
