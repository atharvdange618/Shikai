import { Stack } from "expo-router";
import { useColorScheme } from "react-native";

import { DarkColors, LightColors } from "@/constants/theme";

export default function AppLayout() {
  const isDark = useColorScheme() === "dark";
  const colors = isDark ? DarkColors : LightColors;

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="repo" />
    </Stack>
  );
}
