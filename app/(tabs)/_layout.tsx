import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { useState } from "react";

import { TabCacheWarmup } from "../../components/TabCacheWarmup";
import { CreateTabSheet } from "../../components/CreateTabSheet";
import { TabBarButton } from "../../components/TabBarButton";
import { TabCreateButton } from "../../components/TabCreateButton";
import { useTabBarStyle } from "../../lib/tabBar";
import { colors, spacing } from "../../lib/theme";

export default function TabLayout() {
  const tabBarStyle = useTabBarStyle();
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <>
      <TabCacheWarmup />
      <Tabs
        detachInactiveScreens={false}
        screenOptions={{
          headerShown: false,
          lazy: false,
          freezeOnBlur: true,
          sceneStyle: { backgroundColor: colors.background },
          animation: "none",
          tabBarStyle,
          tabBarButton: (props) => <TabBarButton {...props} />,
          tabBarItemStyle: {
            paddingVertical: spacing.xs,
          },
          tabBarIconStyle: {
            marginBottom: 0,
          },
          tabBarLabelStyle: {
            fontSize: 10,
            fontWeight: "600",
            marginTop: 2,
          },
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textDim,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Home",
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons
                name={focused ? "home" : "home-outline"}
                size={size}
                color={color}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="clubs"
          options={{
            title: "Clubs",
            popToTopOnBlur: true,
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons
                name={focused ? "people" : "people-outline"}
                size={size}
                color={color}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="create"
          options={{
            title: "Create",
            tabBarShowLabel: false,
            tabBarButton: (props) => (
              <TabCreateButton
                style={props.style}
                onPressCreate={() => setCreateOpen(true)}
              />
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
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons
                name={
                  focused
                    ? "chatbubble-ellipses"
                    : "chatbubble-ellipses-outline"
                }
                size={size}
                color={color}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: "Profile",
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons
                name={focused ? "person" : "person-outline"}
                size={size}
                color={color}
              />
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
