import type { ConfigContext, ExpoConfig } from "expo/config";

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: config.name ?? "Highballers",
  slug: config.slug ?? "highballers",
  owner: "kentjohngo",
  extra: {
    ...config.extra,
    eas: {
      projectId: "d8bdb9a0-8b35-4786-b51f-c5b57f808720",
    },
  },
});
