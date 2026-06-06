import { Ionicons } from "@expo/vector-icons";
import { Tabs, usePathname } from "@/lib/expoRouter";
import { useState } from "react";
import { StyleSheet, View } from "react-native";

import { TabCacheWarmup } from "../../components/TabCacheWarmup";
import { CreateTabSheet } from "../../components/CreateTabSheet";
import { TabBarBackground } from "../../components/TabBarBackground";
import { TabBarButton } from "../../components/TabBarButton";
import { TabBarIcon, TAB_ICON_SIZE } from "../../components/TabBarIcon";
import { TabCreateIcon } from "../../components/TabCreateButton";
import { useTheme } from "../../lib/ThemeProvider";
import {
  TAB_BAR_SAFE_AREA_INSETS,
  TAB_LABEL_RESERVED_HEIGHT,
  resolveTabBarStyle,
  useTabBarStyle,
} from "../../lib/tabBar";

export default function TabLayout() {
  const pathname = usePathname();
  const tabBarStyle = useTabBarStyle();
  const resolvedTabBarStyle = resolveTabBarStyle(pathname, tabBarStyle);
  const { colors } = useTheme();
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <>
      <TabCacheWarmup />
      <Tabs
        detachInactiveScreens={false}
        safeAreaInsets={TAB_BAR_SAFE_AREA_INSETS}
        screenOptions={{
          headerShown: false,
          lazy: false,
          freezeOnBlur: true,
          sceneStyle: { backgroundColor: colors.background },
          animation: "none",
          tabBarStyle: resolvedTabBarStyle,
          tabBarHideOnKeyboard: true,
          tabBarBackground: () => <TabBarBackground />,
          tabBarButton: (props) => <TabBarButton {...props} />,
          tabBarItemStyle: {
            height: "100%",
            paddingVertical: 0,
            justifyContent: "center",
          },
          tabBarIconStyle: {
            marginTop: 0,
            marginBottom: 0,
          },
          tabBarLabelStyle: {
            fontSize: 10,
            fontWeight: "600",
            marginTop: 2,
            marginBottom: 2,
          },
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textMuted,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Home",
            tabBarAccessibilityLabel: "Home",
            tabBarIcon: ({ color, focused }) => (
              <TabBarIcon>
                <Ionicons
                  name={focused ? "home" : "home-outline"}
                  size={TAB_ICON_SIZE}
                  color={color}
                />
              </TabBarIcon>
            ),
          }}
        />
        <Tabs.Screen
          name="clubs"
          options={{
            title: "Clubs",
            popToTopOnBlur: true,
            tabBarAccessibilityLabel: "Clubs",
            tabBarIcon: ({ color, focused }) => (
              <TabBarIcon>
                <Ionicons
                  name={focused ? "people" : "people-outline"}
                  size={TAB_ICON_SIZE}
                  color={color}
                />
              </TabBarIcon>
            ),
          }}
        />
        <Tabs.Screen
          name="create"
          options={{
            title: "Create",
            tabBarShowLabel: false,
            tabBarLabel: () => null,
            tabBarAccessibilityLabel: "Create",
            tabBarButton: (props) => (
              <TabBarButton {...props}>
                <View style={styles.createItem}>
                  <TabCreateIcon />
                  <View style={styles.createLabelSpacer} />
                </View>
              </TabBarButton>
            ),
          }}
          listeners={{
            tabPress: (e) => {
              e.preventDefault();
              setCreateOpen(true);
            },
          }}
        />
        <Tabs.Screen
          name="chats"
          options={{
            title: "Chats",
            popToTopOnBlur: true,
            tabBarAccessibilityLabel: "Chats",
            tabBarIcon: ({ color, focused }) => (
              <TabBarIcon>
                <Ionicons
                  name={
                    focused
                      ? "chatbubble-ellipses"
                      : "chatbubble-ellipses-outline"
                  }
                  size={TAB_ICON_SIZE}
                  color={color}
                />
              </TabBarIcon>
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: "Profile",
            tabBarAccessibilityLabel: "Profile",
            tabBarIcon: ({ color, focused }) => (
              <TabBarIcon>
                <Ionicons
                  name={focused ? "person" : "person-outline"}
                  size={TAB_ICON_SIZE}
                  color={color}
                />
              </TabBarIcon>
            ),
          }}
        />
      </Tabs>

      <CreateTabSheet
        visible={createOpen}
        onClose={() => setCreateOpen(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  createItem: {
    alignItems: "center",
  },
  createLabelSpacer: {
    height: TAB_LABEL_RESERVED_HEIGHT,
  },
});
