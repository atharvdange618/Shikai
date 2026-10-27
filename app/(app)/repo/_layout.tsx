import { Stack } from "expo-router";

import { FontFamily, FontSize, useTheme } from "@/constants/theme";

export default function RepoLayout() {
  const { colors } = useTheme();

  return (
    <Stack
      screenOptions={{
        contentStyle: { backgroundColor: colors.background },
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
        headerBackButtonDisplayMode: "minimal",
        headerBackTitle: "",
        // Most screens set their title with navigation.setOptions.
        title: "",
      }}
    >
      <Stack.Screen name="[repoId]/commits" options={{ title: "Commits" }} />
      <Stack.Screen
        name="[repoId]/stargazers"
        options={{ title: "Stargazers" }}
      />
      <Stack.Screen name="[repoId]/forks" options={{ title: "Forks" }} />
    </Stack>
  );
}
