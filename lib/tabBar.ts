import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors } from './theme';

/** Icon + label area above the home-indicator safe area. */
export const TAB_BAR_CONTENT_HEIGHT = Platform.select({ ios: 49, android: 56, default: 56 }) ?? 56;

export function useTabBarInsets() {
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, Platform.OS === 'android' ? 8 : 0);

  return {
    bottomInset,
    height: TAB_BAR_CONTENT_HEIGHT + bottomInset,
  };
}

export function useTabBarPadding(extra = 16) {
  const { height } = useTabBarInsets();
  return height + extra;
}

export function useTabBarStyle() {
  const { bottomInset, height } = useTabBarInsets();

  return {
    backgroundColor: colors.surface,
    borderTopColor: colors.cardBorder,
    borderTopWidth: 1,
    height,
    paddingTop: 4,
    paddingBottom: bottomInset,
  };
}
