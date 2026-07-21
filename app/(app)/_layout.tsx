import { useTheme } from "@/constants/theme";
import { Stack } from "expo-router";

export default function AppLayout() {
  const { colors } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="repo" />
      <Stack.Screen name="user" />
    </Stack>
  );
}
