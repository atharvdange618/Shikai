import { Stack } from "expo-router";
import { useColorScheme } from "react-native";

import { DarkColors, LightColors } from "@/constants/theme";

export default function OverviewLayout() {
  const isDark = useColorScheme() === "dark";
  const colors = isDark ? DarkColors : LightColors;

  return (
    <Stack screenOptions={{ contentStyle: { backgroundColor: colors.background } }}>
      <Stack.Screen
        name="index"
        options={{
          headerShown: false,
        }}
      />
    </Stack>
  );
}
