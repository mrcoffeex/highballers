import type { ExpoConfig } from "expo/config";

import appJson from "./app.json";

const expo = appJson.expo as ExpoConfig;

export default (): ExpoConfig => ({
  ...expo,
  owner: "kentjohngo",
  extra: {
    ...expo.extra,
    eas: {
      projectId: "d8bdb9a0-8b35-4786-b51f-c5b57f808720",
    },
  },
});
