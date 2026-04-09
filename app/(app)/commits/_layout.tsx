import { Stack } from "expo-router";
import { useColorScheme } from "react-native";

import {
  DarkColors,
  FontFamily,
  FontSize,
  LightColors,
} from "@/constants/theme";

export default function CommitsLayout() {
  const isDark = useColorScheme() === "dark";
  const colors = isDark ? DarkColors : LightColors;

  return (
    <Stack>
      <Stack.Screen
        name="[repoId]"
        options={{
          title: "Commits",
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
        }}
      />
    </Stack>
  );
}
