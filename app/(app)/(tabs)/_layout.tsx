import { useQueryClient } from "@tanstack/react-query";
import { BlurView } from "expo-blur";
import { Tabs, useRouter } from "expo-router";
import { useEffect } from "react";
import { Platform, StyleSheet, useColorScheme, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { TabBarIcon } from "@/components/navigation/TabBarIcon";
import { TooltipProvider } from "@/components/shared/Tooltip";
import { ErrorBoundary } from "@/components";
import {
  BorderWidth,
  DarkColors,
  FontFamily,
  Layout,
  LightColors,
  Spacing,
} from "@/constants/theme";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { prefetchOverview, prefetchProfile } from "@/lib/prefetch";

function IOSTabBarBackground() {
  const scheme = useColorScheme();

  return (
    <BlurView
      tint={scheme === "dark" ? "dark" : "light"}
      intensity={80}
      style={StyleSheet.absoluteFill}
    />
  );
}

const renderHomeIcon = ({
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

const renderStarsIcon = ({
  color,
  size,
  focused,
}: {
  color: string;
  size: number;
  focused: boolean;
}) => (
  <TabBarIcon
    name="star"
    filledName="star-fill"
    color={color}
    size={size}
    focused={focused}
  />
);

const renderSearchIcon = ({
  color,
  size,
  focused,
}: {
  color: string;
  size: number;
  focused: boolean;
}) => <TabBarIcon name="search" color={color} size={size} focused={focused} />;

const renderBookmarkIcon = ({
  color,
  size,
  focused,
}: {
  color: string;
  size: number;
  focused: boolean;
}) => (
  <TabBarIcon
    name="bookmark"
    filledName="bookmark-filled"
    color={color}
    size={size}
    focused={focused}
  />
);

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
  const scheme = useColorScheme();
  const isDark = scheme === "dark";
  const colors = isDark ? DarkColors : LightColors;
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const router = useRouter();

  useKeyboardShortcuts({
    onTabSwitch: (index: number) => {
      const routes = [
        "/overview",
        "/repos",
        "/search",
        "/stars",
        "/watchlist",
        "/profile",
      ];
      const route = routes[index];
      if (route) router.push(`/(app)/(tabs)${route}` as any);
    },
  });

  useEffect(() => {
    prefetchProfile(queryClient);
    prefetchOverview(queryClient);
  }, [queryClient]);

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
                fontSize: 10,
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
                tabBarIcon: renderHomeIcon,
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
              name="stars"
              options={{
                title: "Stars",
                tabBarIcon: renderStarsIcon,
              }}
            />

            <Tabs.Screen
              name="watchlist"
              options={{
                title: "Watchlist",
                tabBarIcon: renderBookmarkIcon,
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
