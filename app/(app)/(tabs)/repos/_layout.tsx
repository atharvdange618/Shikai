import { Stack } from "expo-router";

import { FontFamily, FontSize, useTheme } from "@/constants/theme";

export default function ReposLayout() {
  const { colors } = useTheme();

  return (
    <Stack
      screenOptions={{ contentStyle: { backgroundColor: colors.background } }}
    >
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
