import { useQueryClient } from "@tanstack/react-query";
import { Tabs } from "expo-router";
import { useEffect, useMemo } from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { TabBarIcon } from "@/components/navigation/TabBarIcon";
import { TooltipProvider } from "@/components/shared/Tooltip";
import {
  BorderWidth,
  FontFamily,
  Layout,
  Spacing,
  useTheme,
} from "@/constants/theme";
import { useNotifications } from "@/hooks/useNotifications";
import { useUser } from "@/hooks/useUser";
import { prefetchOverview, prefetchProfile } from "@/lib/prefetch";
import { useAuthStore } from "@/stores/auth.store";

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

const renderNotificationsIcon = ({
  color,
  size,
  focused,
}: {
  color: string;
  size: number;
  focused: boolean;
}) => (
  <TabBarIcon
    name="bell"
    filledName="bell-fill"
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
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();

  const { data: user } = useUser();
  const pat = useAuthStore((s) => s.pat);

  const { notifications } = useNotifications(Boolean(pat));
  const unreadCount = useMemo(
    () => notifications.filter((n) => n.unread).length,
    [notifications],
  );

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
                marginBottom: 4,
              },

              tabBarStyle: {
                height: Layout.tabBarHeight + insets.bottom,
                paddingBottom: insets.bottom,
                backgroundColor: colors.tabBarBackground,
                borderTopWidth: BorderWidth.thin,
                borderTopColor: colors.border,
                elevation: 0,
              },

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
              name="notifications"
              options={{
                title: "Notifications",
                tabBarIcon: renderNotificationsIcon,
                tabBarBadge:
                  unreadCount > 0
                    ? unreadCount > 99
                      ? "99+"
                      : unreadCount
                    : undefined,
                href: pat ? undefined : null,
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
