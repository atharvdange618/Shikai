import { TooltipProvider } from "@/components/shared/Tooltip";
import { useTheme } from "@/constants/theme";
import { Stack } from "expo-router";

/**
 * The tooltip provider lives here, not in `(tabs)`: repo and user screens are
 * siblings of the tabs, and their header InfoDots need the same context to
 * open. See D-037.
 */
export default function AppLayout() {
  const { colors } = useTheme();

  return (
    <TooltipProvider>
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
    </TooltipProvider>
  );
}
