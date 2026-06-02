/**
 * Expo Go safe expo-router entry points.
 * JS Stack still resolves Android gesture-handler unless Metro stubs it
 * (see EXPO_PUBLIC_EXPO_GO_GESTURE_STUB in metro.config.js / npm run android:dev).
 */
export { Stack } from "expo-router/js-stack";
export { Tabs } from "expo-router/js-tabs";
export { Link, Redirect } from "expo-router/build/link";
export {
  useRouter,
  useLocalSearchParams,
  useGlobalSearchParams,
  useRootNavigationState,
  usePathname,
  useSegments,
  useNavigationContainerRef,
} from "expo-router/build/hooks";
export { DarkTheme } from "expo-router/build/react-navigation/native/theming/DarkTheme";
export { DefaultTheme } from "expo-router/build/react-navigation/native/theming/DefaultTheme";
export { ThemeProvider } from "expo-router/build/react-navigation/core/theming/ThemeProvider";
