import { Stack } from "expo-router";

import { FontFamily, FontSize, useTheme } from "@/constants/theme";

export default function UserLayout() {
  const { colors } = useTheme();

  const sharedHeaderOptions = {
    headerTitleStyle: {
      fontFamily: FontFamily.semiBold,
      fontSize: FontSize.title,
      color: colors.textPrimary,
    },
    headerShadowVisible: false,
    headerStyle: {
      backgroundColor: colors.background,
    },
    headerTintColor: colors.accent,
    headerBackButtonDisplayMode: "minimal" as const,
    headerBackTitle: "",
  };

  return (
    <Stack
      screenOptions={{ contentStyle: { backgroundColor: colors.background } }}
    >
      <Stack.Screen
        name="[username]/index"
        options={{ ...sharedHeaderOptions, title: "" }}
      />
      <Stack.Screen
        name="[username]/repos"
        options={{ ...sharedHeaderOptions, title: "Repositories" }}
      />
      <Stack.Screen
        name="[username]/gists"
        options={{ ...sharedHeaderOptions, title: "Gists" }}
      />
      <Stack.Screen
        name="[username]/gist/[id]"
        options={{ ...sharedHeaderOptions, title: "Gist" }}
      />
    </Stack>
  );
}
