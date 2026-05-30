import Constants from "expo-constants";
import * as Linking from "expo-linking";
import { Platform } from "react-native";

const APP_SCHEME = "highballers";

export function getClubInvitePath(clubId: string) {
  return `/clubs/${clubId}`;
}

export function getClubInviteUrl(clubId: string) {
  const configuredOrigin = process.env.EXPO_PUBLIC_APP_URL?.replace(/\/$/, "");

  if (Platform.OS === "web" && typeof window !== "undefined") {
    return `${configuredOrigin ?? window.location.origin}${getClubInvitePath(clubId)}`;
  }

  if (configuredOrigin) {
    return `${configuredOrigin}${getClubInvitePath(clubId)}`;
  }

  return Linking.createURL(getClubInvitePath(clubId), { scheme: APP_SCHEME });
}

export function getClubInviteMessage(clubName: string, clubId: string) {
  const url = getClubInviteUrl(clubId);
  return `Join ${clubName} on HighBallers!\n${url}`;
}

export function getAppDisplayName() {
  return Constants.expoConfig?.name ?? "HighBallers";
}
