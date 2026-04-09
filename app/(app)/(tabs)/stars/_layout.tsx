import { Stack } from "expo-router";
import { useColorScheme } from "react-native";

import {
  DarkColors,
  FontFamily,
  FontSize,
  LightColors,
} from "@/constants/theme";

export default function StarsLayout() {
  const isDark = useColorScheme() === "dark";
  const colors = isDark ? DarkColors : LightColors;

  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          title: "Starred",
          headerLargeTitle: true,
          headerLargeTitleStyle: {
            fontFamily: FontFamily.bold,
            color: colors.textPrimary,
          },
          headerTitleStyle: {
            fontFamily: FontFamily.semiBold,
            fontSize: FontSize.title,
            color: colors.textPrimary,
          },
          headerLargeTitleShadowVisible: false,
          headerShadowVisible: false,
          headerStyle: {
            backgroundColor: colors.background,
          },
          headerLargeStyle: {
            backgroundColor: colors.background,
          },
          headerTintColor: colors.accent,
        }}
      />
    </Stack>
  );
}
