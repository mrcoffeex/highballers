import Constants from "expo-constants";
import * as Linking from "expo-linking";
import { Platform } from "react-native";

import { getAppDisplayName } from "./clubInvite";

/** Bump when policy text changes; used for consent tracking. */
export const LEGAL_VERSION = "2026-05-30";

const APP_SCHEME = "highballers";

export const LEGAL_EMAIL =
  process.env.EXPO_PUBLIC_LEGAL_EMAIL ??
  process.env.EXPO_PUBLIC_SUPPORT_EMAIL ??
  "legal@highballers.app";

export type LegalDocumentId = "privacy" | "terms";

export function getLegalDocumentTitle(id: LegalDocumentId): string {
  return id === "privacy" ? "Privacy Policy" : "Terms & Conditions";
}

function getAppOrigin(): string | undefined {
  const configured = process.env.EXPO_PUBLIC_APP_URL?.replace(/\/$/, "");
  if (configured) return configured;
  if (Platform.OS === "web" && typeof window !== "undefined") {
    return window.location.origin;
  }
  return undefined;
}

export function getLegalDocumentPath(id: LegalDocumentId): string {
  return `/legal/${id}`;
}

export function getLegalDocumentUrl(id: LegalDocumentId): string {
  const origin = getAppOrigin();
  const path = getLegalDocumentPath(id);
  if (origin) return `${origin}${path}`;
  return Linking.createURL(path, { scheme: APP_SCHEME });
}

export const LEGAL_URLS = {
  privacy: getLegalDocumentUrl("privacy"),
  terms: getLegalDocumentUrl("terms"),
} as const;

export function getLegalMailto(subject: string): string {
  return `mailto:${LEGAL_EMAIL}?subject=${encodeURIComponent(subject)}`;
}

export function getAccountDeletionMailto(): string {
  return getLegalMailto(`${getAppDisplayName()} — Account deletion request`);
}

export const APP_LEGAL_META = {
  appName: getAppDisplayName(),
  companyName:
    Constants.expoConfig?.extra?.legalEntityName ?? getAppDisplayName(),
  effectiveDate: "May 30, 2026",
  contactEmail: LEGAL_EMAIL,
  minimumAge: 13,
};
