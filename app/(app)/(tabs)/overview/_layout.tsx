import { Stack } from "expo-router";

import { FontFamily, FontSize } from "@/constants/theme";
import { useThemeContext } from "@/contexts/ThemeContext";

export default function OverviewLayout() {
  const { theme } = useThemeContext();
  const { colors } = theme;

  return (
    <Stack
      screenOptions={{ contentStyle: { backgroundColor: colors.background } }}
    >
      <Stack.Screen
        name="index"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="feed"
        options={{
          headerShown: true,
          title: "Following",
          headerStyle: { backgroundColor: colors.background },
          headerTitleStyle: {
            fontFamily: FontFamily.semiBold,
            fontSize: FontSize.title,
            color: colors.textPrimary,
          },
          headerTintColor: colors.accent,
          headerShadowVisible: false,
        }}
      />
    </Stack>
  );
}
