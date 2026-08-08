import { useQueryClient } from "@tanstack/react-query";
import { BlurView } from "expo-blur";
import { Tabs, useRouter } from "expo-router";
import { useEffect } from "react";
import { Platform, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ErrorBoundary } from "@/components";
import { TabBarIcon } from "@/components/navigation/TabBarIcon";
import { TooltipProvider } from "@/components/shared/Tooltip";
import {
  BorderWidth,
  FontFamily,
  Layout,
  Spacing,
  useTheme,
} from "@/constants/theme";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useUser } from "@/hooks/useUser";
import { prefetchOverview, prefetchProfile } from "@/lib/prefetch";

function IOSTabBarBackground() {
  const { isDark } = useTheme();

  return (
    <BlurView
      tint={isDark ? "dark" : "light"}
      intensity={80}
      style={StyleSheet.absoluteFill}
    />
  );
}

const renderOverviewIcon = ({
  color,
  size,
  focused,
}: {
  color: string;
  size: number;
  focused: boolean;
}) => (
  <TabBarIcon
    name="home"
    filledName="home-fill"
    color={color}
    size={size}
    focused={focused}
  />
);

const renderReposIcon = ({
  color,
  size,
  focused,
}: {
  color: string;
  size: number;
  focused: boolean;
}) => <TabBarIcon name="repo" color={color} size={size} focused={focused} />;

const renderSearchIcon = ({
  color,
  size,
  focused,
}: {
  color: string;
  size: number;
  focused: boolean;
}) => <TabBarIcon name="search" color={color} size={size} focused={focused} />;

const renderProfileIcon = ({
  color,
  size,
  focused,
}: {
  color: string;
  size: number;
  focused: boolean;
}) => (
  <TabBarIcon
    name="person"
    filledName="person-fill"
    color={color}
    size={size}
    focused={focused}
  />
);

export default function TabsLayout() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const router = useRouter();

  useKeyboardShortcuts({
    onTabSwitch: (index: number) => {
      const routes = [
        "/(app)/(tabs)/overview",
        "/(app)/(tabs)/repos",
        "/(app)/(tabs)/search",
        "/(app)/(tabs)/profile",
      ] as const;
      const route = routes[index];
      if (route) router.push(route);
    },
  });

  const { data: user } = useUser();

  useEffect(() => {
    prefetchProfile(queryClient);
    prefetchOverview(queryClient, user?.login);
  }, [queryClient, user?.login]);

  return (
    <TooltipProvider>
      <ErrorBoundary>
        <View style={{ flex: 1, backgroundColor: colors.background }}>
          <Tabs
            screenOptions={{
              headerShown: false,

              tabBarActiveTintColor: colors.tabBarActive,
              tabBarInactiveTintColor: colors.tabBarInactive,

              tabBarLabelStyle: {
                fontFamily: FontFamily.medium,
                fontSize: 12,
                marginTop: -2,
                marginBottom: Platform.OS === "android" ? 4 : 0,
              },

              tabBarStyle: {
                height: Layout.tabBarHeight + insets.bottom,
                paddingBottom: insets.bottom,
                backgroundColor: Platform.select({
                  ios: "transparent",
                  android: colors.tabBarBackground,
                }),
                borderTopWidth: Platform.select({
                  ios: 0,
                  android: BorderWidth.thin,
                }),
                borderTopColor: colors.border,
                elevation: 0,
              },

              tabBarBackground:
                Platform.OS === "ios"
                  ? () => <IOSTabBarBackground />
                  : undefined,

              tabBarIconStyle: {
                marginTop: Spacing.xs,
              },
            }}
          >
            <Tabs.Screen
              name="overview"
              options={{
                title: "Overview",
                tabBarIcon: renderOverviewIcon,
              }}
            />

            <Tabs.Screen
              name="repos"
              options={{
                title: "Repos",
                tabBarIcon: renderReposIcon,
              }}
            />

            <Tabs.Screen
              name="search"
              options={{
                title: "Search",
                tabBarIcon: renderSearchIcon,
              }}
            />

            <Tabs.Screen
              name="profile"
              options={{
                title: "Profile",
                tabBarIcon: renderProfileIcon,
              }}
            />
          </Tabs>
        </View>
      </ErrorBoundary>
    </TooltipProvider>
  );
}
