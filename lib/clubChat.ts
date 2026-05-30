import { format, isToday, isYesterday } from "date-fns";

import { formatChatMessagePreview } from "./chatMessageContent";

export function formatChatTimestamp(iso: string) {
  const date = new Date(iso);
  if (isToday(date)) return format(date, "h:mm a");
  if (isYesterday(date)) return "Yesterday";
  return format(date, "MMM d");
}

export function formatChatPreview(body: string, maxLength = 72) {
  return formatChatMessagePreview(body, maxLength);
}
