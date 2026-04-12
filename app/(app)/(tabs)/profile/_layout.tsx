import { Drawer } from "expo-router/drawer";
import { useColorScheme, useWindowDimensions } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { ProfileDrawerContent } from "@/components/navigation/ProfileDrawerContent";
import {
  DarkColors,
  FontFamily,
  FontSize,
  LightColors,
} from "@/constants/theme";

export default function ProfileLayout() {
  const { width } = useWindowDimensions();
  const isDark = useColorScheme() === "dark";
  const colors = isDark ? DarkColors : LightColors;

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
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Drawer
        drawerContent={(props) => <ProfileDrawerContent {...props} />}
        screenOptions={{
          ...sharedHeaderOptions,
          drawerPosition: "right",
          drawerType: "front",
          drawerStyle: {
            backgroundColor: colors.surface,
            width: width * 0.72,
          },
          overlayColor: "rgba(0, 0, 0, 0.4)",
          swipeEnabled: true,
          swipeEdgeWidth: 60,
          headerShown: true,
        }}
      >
        <Drawer.Screen
          name="index"
          options={{
            ...sharedHeaderOptions,
            title: "Profile",
            headerRight: undefined,
          }}
        />

        <Drawer.Screen
          name="settings"
          options={{
            ...sharedHeaderOptions,
            title: "Settings",
          }}
        />
      </Drawer>
    </GestureHandlerRootView>
  );
}
