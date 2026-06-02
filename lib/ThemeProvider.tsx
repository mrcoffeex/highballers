import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SystemUI from "expo-system-ui";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  Appearance,
  StyleSheet,
  useColorScheme,
  type StyleSheet as StyleSheetType,
} from "react-native";

import {
  getColorsForScheme,
  colors as legacyColorBridge,
  type ColorScheme,
  type ThemeColors,
  type ThemePreference,
} from "./theme";

const THEME_PREFERENCE_KEY = "@highballers/theme-preference";

interface ThemeContextValue {
  themePreference: ThemePreference;
  setThemePreference: (preference: ThemePreference) => void;
  colorScheme: ColorScheme;
  colors: ThemeColors;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function resolveColorScheme(
  preference: ThemePreference,
  systemScheme: string | null | undefined,
): ColorScheme {
  if (preference === "system") {
    return systemScheme === "light" ? "light" : "dark";
  }

  return preference;
}

/** RN Web does not implement Appearance.setColorScheme; app theme still comes from context. */
function applyNativeColorScheme(preference: ThemePreference) {
  const setColorScheme = Appearance.setColorScheme;
  if (typeof setColorScheme !== "function") return;

  if (preference !== "system") {
    setColorScheme(preference);
  }
}

export function AppThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useColorScheme();
  const [themePreference, setThemePreferenceState] =
    useState<ThemePreference>("system");
  const [preferenceLoaded, setPreferenceLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(THEME_PREFERENCE_KEY)
      .then((stored) => {
        if (stored === "system" || stored === "light" || stored === "dark") {
          setThemePreferenceState(stored);
        }
      })
      .finally(() => setPreferenceLoaded(true));
  }, []);

  const setThemePreference = useCallback((preference: ThemePreference) => {
    setThemePreferenceState(preference);
    void AsyncStorage.setItem(THEME_PREFERENCE_KEY, preference);
  }, []);

  const colorScheme = resolveColorScheme(themePreference, systemScheme);
  const colors = useMemo(() => getColorsForScheme(colorScheme), [colorScheme]);
  const isDark = colorScheme === "dark";

  useEffect(() => {
    if (!preferenceLoaded) return;
    applyNativeColorScheme(themePreference);
  }, [preferenceLoaded, themePreference]);

  useEffect(() => {
    Object.assign(legacyColorBridge, colors);
    void SystemUI.setBackgroundColorAsync(colors.background);
  }, [colors]);

  const value = useMemo(
    () => ({
      themePreference,
      setThemePreference,
      colorScheme,
      colors,
      isDark,
    }),
    [colorScheme, colors, isDark, setThemePreference, themePreference],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within AppThemeProvider");
  }

  return context;
}

export function useThemedStyles<
  T extends StyleSheetType.NamedStyles<T> | StyleSheetType.NamedStyles<unknown>,
>(factory: (colors: ThemeColors) => T): T {
  const { colors } = useTheme();
  return useMemo(() => StyleSheet.create(factory(colors)), [colors, factory]);
}
