import { Stack } from "expo-router";

import { FontFamily, FontSize } from "@/constants/theme";
import { useTheme } from "@/contexts/ThemeContext";

export default function ProfileLayout() {
  const theme = useTheme();
  const colors = theme.colors;

  const sharedHeaderOptions = {
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
  };

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          ...sharedHeaderOptions,
          headerShown: true,
          title: "Profile",
        }}
      />
      <Stack.Screen
        name="settings"
        options={{
          ...sharedHeaderOptions,
          headerShown: true,
          title: "Theme",
        }}
      />
      <Stack.Screen
        name="about"
        options={{
          ...sharedHeaderOptions,
          headerShown: true,
          title: "About",
        }}
      />
    </Stack>
  );
}
