import { Ionicons } from '@expo/vector-icons';
import { Tabs, router } from 'expo-router';

import { useTabBarStyle } from '../../lib/tabBar';
import { colors } from '../../lib/theme';

export default function TabLayout() {
  const tabBarStyle = useTabBarStyle();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle,
        tabBarItemStyle: {
          paddingVertical: 0,
        },
        tabBarIconStyle: {
          marginBottom: 0,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 2,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textDim,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="clubs"
        options={{
          title: 'Clubs',
          tabBarIcon: ({ color, size }) => <Ionicons name="people" size={size} color={color} />,
        }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            const state = navigation.getState();
            const activeRoute = state.routes[state.index];

            if (activeRoute.name !== 'clubs') return;

            const stackIndex = activeRoute.state?.index ?? 0;
            if (stackIndex > 0) {
              e.preventDefault();
              router.navigate('/clubs');
            }
          },
        })}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => <Ionicons name="person" size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
