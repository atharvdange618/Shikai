import { Stack } from "expo-router";
import { Platform, useColorScheme } from "react-native";

import {
  DarkColors,
  FontFamily,
  FontSize,
  LightColors,
} from "@/constants/theme";

export default function ReposLayout() {
  const isDark = useColorScheme() === "dark";
  const colors = isDark ? DarkColors : LightColors;

  const sharedHeaderOptions = {
    headerStyle: {
      backgroundColor: colors.background,
    },
    headerTitleStyle: {
      fontFamily: FontFamily.semiBold,
      fontSize: FontSize.title,
      color: colors.textPrimary,
    },
    headerTintColor: colors.accent,
    headerShadowVisible: false,
    headerBackButtonDisplayMode: "minimal" as const,
    headerBackTitle: "",
    headerBottomBorderColor: colors.border,
  };

  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          ...sharedHeaderOptions,
          title: "Repositories",
          headerLargeTitle: true,
          headerLargeTitleStyle: {
            fontFamily: FontFamily.bold,
            color: colors.textPrimary,
          },
          headerLargeTitleShadowVisible: false,
          headerLargeStyle: {
            backgroundColor: colors.background,
          },
        }}
      />

      <Stack.Screen
        name="[repoId]/index"
        options={{
          ...sharedHeaderOptions,
          title: "",
          headerTransparent: Platform.OS === "ios",
          headerBlurEffect:
            Platform.OS === "ios" ? (isDark ? "dark" : "light") : undefined,
          headerStyle:
            Platform.OS === "ios"
              ? undefined
              : { backgroundColor: colors.background },
        }}
      />

      <Stack.Screen
        name="[repoId]/commits"
        options={{
          ...sharedHeaderOptions,
          title: "Commits",
          headerTransparent: Platform.OS === "ios",
          headerBlurEffect:
            Platform.OS === "ios" ? (isDark ? "dark" : "light") : undefined,
          headerStyle:
            Platform.OS === "ios"
              ? undefined
              : { backgroundColor: colors.background },
        }}
      />

      <Stack.Screen
        name="[repoId]/files"
        options={{
          ...sharedHeaderOptions,
          title: "Files",
          headerTransparent: Platform.OS === "ios",
          headerBlurEffect:
            Platform.OS === "ios" ? (isDark ? "dark" : "light") : undefined,
          headerStyle:
            Platform.OS === "ios"
              ? undefined
              : { backgroundColor: colors.background },
        }}
      />

      <Stack.Screen
        name="[repoId]/file"
        options={{
          ...sharedHeaderOptions,
          title: "",
          headerTransparent: Platform.OS === "ios",
          headerBlurEffect:
            Platform.OS === "ios" ? (isDark ? "dark" : "light") : undefined,
          headerStyle:
            Platform.OS === "ios"
              ? undefined
              : { backgroundColor: colors.background },
        }}
      />

      <Stack.Screen
        name="[repoId]/issues"
        options={{
          ...sharedHeaderOptions,
          title: "Issues",
          headerTransparent: Platform.OS === "ios",
          headerBlurEffect:
            Platform.OS === "ios" ? (isDark ? "dark" : "light") : undefined,
          headerStyle:
            Platform.OS === "ios"
              ? undefined
              : { backgroundColor: colors.background },
        }}
      />

      <Stack.Screen
        name="[repoId]/pull-requests"
        options={{
          ...sharedHeaderOptions,
          title: "Pull Requests",
          headerTransparent: Platform.OS === "ios",
          headerBlurEffect:
            Platform.OS === "ios" ? (isDark ? "dark" : "light") : undefined,
          headerStyle:
            Platform.OS === "ios"
              ? undefined
              : { backgroundColor: colors.background },
        }}
      />
    </Stack>
  );
}
