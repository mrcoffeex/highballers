export function isInstalledNativeApp(options: {
  platformOs: string;
  appOwnership: "expo" | "guest" | null;
}): boolean {
  return options.platformOs !== "web" && options.appOwnership !== "expo";
}

/** Preview/store/dev-client builds use native Google Sign-In — not browser OAuth redirects. */
export function canUseNativeGoogleSignIn(options: {
  platformOs: string;
  appOwnership: "expo" | "guest" | null;
  webClientId?: string;
}): boolean {
  return isInstalledNativeApp(options);
}
