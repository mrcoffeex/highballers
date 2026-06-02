const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const projectRoot = __dirname;

/** No-op stack gestures — used when EXPO_PUBLIC_EXPO_GO_GESTURE_STUB=1 (Expo Go). */
const expoRouterGestureStub = path.resolve(
  projectRoot,
  "node_modules/expo-router/build/react-navigation/stack/views/GestureHandler.js",
);

const config = getDefaultConfig(projectRoot);

const defaultResolveRequest = config.resolver.resolveRequest;

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (
    process.env.EXPO_PUBLIC_EXPO_GO_GESTURE_STUB === "1" &&
    platform &&
    platform !== "web" &&
    moduleName === "../GestureHandler" &&
    context.originModulePath?.includes(`${path.sep}StackView.js`)
  ) {
    return { type: "sourceFile", filePath: expoRouterGestureStub };
  }

  if (defaultResolveRequest) {
    return defaultResolveRequest(context, moduleName, platform);
  }

  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
