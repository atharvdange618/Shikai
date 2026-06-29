import { Stack } from "expo-router";

import { FontFamily, FontSize, useTheme } from "@/constants/theme";

export default function UserLayout() {
  const { colors } = useTheme();

  return (
    <Stack
      screenOptions={{ contentStyle: { backgroundColor: colors.background } }}
    >
      <Stack.Screen
        name="[username]/index"
        options={{
          title: "",
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
          headerBackButtonDisplayMode: "minimal",
          headerBackTitle: "",
        }}
      />
    </Stack>
  );
}
