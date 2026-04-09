import { BlurView } from "expo-blur";
import { Tabs } from "expo-router";
import { useCallback } from "react";
import { Platform, StyleSheet, useColorScheme } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { TabBarIcon } from "@/components/navigation/TabBarIcon";
import {
  BorderWidth,
  DarkColors,
  FontFamily,
  Layout,
  LightColors,
  Spacing,
} from "@/constants/theme";

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

export default function TabsLayout() {
  const scheme = useColorScheme();
  const isDark = scheme === "dark";
  const colors = isDark ? DarkColors : LightColors;
  const insets = useSafeAreaInsets();

  const renderHomeIcon = useCallback(
    ({
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
    ),

    [],
  );

  const renderReposIcon = useCallback(
    ({
      color,
      size,
      focused,
    }: {
      color: string;
      size: number;
      focused: boolean;
    }) => (
      <TabBarIcon name="repo" color={color} size={size} focused={focused} />
    ),
    [],
  );

  const renderStarsIcon = useCallback(
    ({
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
    ),
    [],
  );

  const renderProfileIcon = useCallback(
    ({
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
    ),
    [],
  );

  return (
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
          Platform.OS === "ios" ? () => <IOSTabBarBackground /> : undefined,

        tabBarIconStyle: {
          marginTop: Spacing.xs,
        },
      }}
    >
      <Tabs.Screen
        name="index"
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
        name="stars"
        options={{
          title: "Stars",
          tabBarIcon: renderStarsIcon,
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
  );
}
