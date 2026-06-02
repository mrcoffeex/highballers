/** When true in dev, clear auth on launch and open the login screen. */
export function devStartAtLogin(): boolean {
  return __DEV__ && process.env.EXPO_PUBLIC_DEV_START_AT_LOGIN === "true";
}
