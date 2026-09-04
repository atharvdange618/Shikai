import { Stack } from "expo-router";
import { Platform } from "react-native";

import { FontFamily, FontSize, useTheme } from "@/constants/theme";

export default function RepoLayout() {
  const { colors, isDark } = useTheme();

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
    <Stack
      screenOptions={{ contentStyle: { backgroundColor: colors.background } }}
    >
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

      <Stack.Screen
        name="[repoId]/issue/[number]"
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
        name="[repoId]/pr/[number]"
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
        name="[repoId]/commit/[sha]"
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
        name="[repoId]/checks/[runId]"
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
        name="[repoId]/compare"
        options={{
          ...sharedHeaderOptions,
          title: "Compare",
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
        name="[repoId]/releases"
        options={{
          ...sharedHeaderOptions,
          title: "Releases",
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
        name="[repoId]/release/[tag]"
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
    </Stack>
  );
}
