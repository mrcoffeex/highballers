import * as Linking from "expo-linking";
import { Platform } from "react-native";

import { ActivityStorySlide } from "./activityStories";
import { getAppDisplayName } from "./clubInvite";
import { BOX_SCORE_FIELDS, BOX_SCORE_LABELS, UserProfile } from "./types";

const APP_SCHEME = "highballers";

export function getEventShareUrl(eventId: string) {
  const configuredOrigin = process.env.EXPO_PUBLIC_APP_URL?.replace(/\/$/, "");

  if (Platform.OS === "web" && typeof window !== "undefined") {
    return `${configuredOrigin ?? window.location.origin}/event/${eventId}`;
  }

  if (configuredOrigin) {
    return `${configuredOrigin}/event/${eventId}`;
  }

  return Linking.createURL(`/event/${eventId}`, { scheme: APP_SCHEME });
}

export function formatActivityStoryShareMessage(
  slide: ActivityStorySlide,
  user: UserProfile,
) {
  const title = slide.game.event?.title ?? "Pickup game";
  const statLine = BOX_SCORE_FIELDS.map(
    (field) => `${slide.game.stats[field]} ${BOX_SCORE_LABELS[field]}`,
  ).join(" · ");
  const clubLine = slide.clubName ? `\n${slide.clubName}` : "";
  const url = getEventShareUrl(slide.game.eventId);

  return `${user.nickname ?? user.name} just balled out 🏀\n${title} — ${statLine}\nGame score ${slide.performanceScore}${clubLine}\n\n${getAppDisplayName()}\n${url}`;
}
