import type { ConfigContext, ExpoConfig } from "expo/config";

export default ({ config }: ConfigContext): ExpoConfig => {
  const plugins: ExpoConfig["plugins"] = [...(config.plugins ?? [])];
  const googleIosUrlScheme =
    process.env.EXPO_PUBLIC_GOOGLE_IOS_URL_SCHEME?.trim() ?? "";

  const hasGoogleSignInPlugin = plugins.some(
    (plugin) =>
      plugin === "@react-native-google-signin/google-signin" ||
      (Array.isArray(plugin) &&
        plugin[0] === "@react-native-google-signin/google-signin"),
  );

  if (!hasGoogleSignInPlugin) {
    if (googleIosUrlScheme) {
      plugins.push([
        "@react-native-google-signin/google-signin",
        { iosUrlScheme: googleIosUrlScheme },
      ]);
    } else {
      // Android native sign-in: autolink module without Firebase / iOS URL scheme.
      plugins.push("@react-native-google-signin/google-signin");
    }
  }

  return {
    ...config,
    name: config.name ?? "Highballers",
    slug: config.slug ?? "highballers",
    owner: "kentjohngo",
    plugins,
    extra: {
      ...config.extra,
      giphyApiKey: process.env.EXPO_PUBLIC_GIPHY_API_KEY,
      eas: {
        projectId: "d8bdb9a0-8b35-4786-b51f-c5b57f808720",
      },
    },
  };
};
