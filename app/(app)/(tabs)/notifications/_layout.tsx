import { Stack } from "expo-router";

import { useTheme } from "@/constants/theme";

export default function NotificationsLayout() {
  const { colors } = useTheme();

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
    </Stack>
  );
}
