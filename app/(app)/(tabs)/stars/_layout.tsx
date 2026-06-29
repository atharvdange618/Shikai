import { Stack } from "expo-router";

import { FontFamily, FontSize, useTheme } from "@/constants/theme";

export default function StarsLayout() {
  const { colors } = useTheme();

  return (
    <Stack
      screenOptions={{ contentStyle: { backgroundColor: colors.background } }}
    >
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
