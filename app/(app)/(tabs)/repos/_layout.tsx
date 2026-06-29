import { Stack } from "expo-router";
import { useColorScheme } from "react-native";

import {
  DarkColors,
  FontFamily,
  FontSize,
  LightColors,
} from "@/constants/theme";

export default function ReposLayout() {
  const isDark = useColorScheme() === "dark";
  const colors = isDark ? DarkColors : LightColors;

  return (
    <Stack screenOptions={{ contentStyle: { backgroundColor: colors.background } }}>
      <Stack.Screen
        name="index"
        options={{
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
          headerLargeTitle: true,
          headerLargeTitleStyle: {
            fontFamily: FontFamily.bold,
            color: colors.textPrimary,
          },
          headerLargeTitleShadowVisible: false,
          headerLargeStyle: {
            backgroundColor: colors.background,
          },
          title: "Repositories",
        }}
      />
    </Stack>
  );
}
