import { Octicons } from "@expo/vector-icons";
import type { DrawerContentComponentProps } from "@react-navigation/drawer";
import { DrawerContentScrollView } from "@react-navigation/drawer";
import { Image } from "expo-image";
import { Href, useRouter } from "expo-router";
import {
  Pressable,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  AvatarSize,
  DarkColors,
  FontFamily,
  FontSize,
  IconSize,
  LightColors,
  Radius,
  Spacing,
} from "@/constants/theme";
import { deleteToken } from "@/lib/secure-storage";
import { useAuthStore } from "@/stores/auth.store";

export function ProfileDrawerContent(props: DrawerContentComponentProps) {
  const isDark = useColorScheme() === "dark";
  const colors = isDark ? DarkColors : LightColors;
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const user = useAuthStore((s) => s.user);
  const clearAuth = useAuthStore((s) => s.clearAuth);

  async function handleSignOut() {
    await deleteToken();
    clearAuth();
  }

  function handleSettings() {
    router.push("/(app)/(tabs)/profile/settings" as Href);
    props.navigation.closeDrawer();
  }

  const s = buildStyles(colors);

  return (
    <DrawerContentScrollView
      {...props}
      scrollEnabled={false}
      contentContainerStyle={[
        s.container,
        { paddingBottom: insets.bottom + Spacing.lg },
      ]}
    >
      <View style={s.userBlock}>
        {user?.avatar_url ? (
          <Image
            source={{ uri: user.avatar_url }}
            style={s.avatar}
            contentFit="cover"
            transition={200}
          />
        ) : (
          <View style={[s.avatar, s.avatarFallback]}>
            <Octicons
              name="person"
              size={IconSize.lg}
              color={colors.textMuted}
            />
          </View>
        )}

        <View style={s.userText}>
          <Text style={s.displayName} numberOfLines={1}>
            {user?.name ?? user?.login ?? "—"}
          </Text>
          <Text style={s.username} numberOfLines={1}>
            @{user?.login ?? "—"}
          </Text>
        </View>
      </View>

      <View style={s.divider} />

      <View style={s.navSection}>
        <Pressable
          style={({ pressed }) => [s.navItem, pressed && s.navItemPressed]}
          onPress={handleSettings}
          hitSlop={4}
        >
          <View style={s.navIconWrap}>
            <Octicons
              name="gear"
              size={IconSize.md}
              color={colors.textSecondary}
            />
          </View>
          <Text style={s.navLabel}>Settings</Text>
          <Octicons
            name="chevron-right"
            size={IconSize.sm}
            color={colors.textMuted}
          />
        </Pressable>
      </View>

      <View style={s.spacer} />

      <Pressable
        style={({ pressed }) => [
          s.signOutButton,
          pressed && s.signOutButtonPressed,
        ]}
        onPress={handleSignOut}
        hitSlop={4}
      >
        <Octicons name="sign-out" size={IconSize.md} color={colors.danger} />
        <Text style={[s.navLabel, s.signOutLabel]}>Sign Out</Text>
      </Pressable>
    </DrawerContentScrollView>
  );
}

function buildStyles(colors: typeof LightColors | typeof DarkColors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      padding: Spacing.lg,
    },

    userBlock: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.md,
      paddingTop: Spacing.sm,
      paddingBottom: Spacing.lg,
    },

    avatar: {
      width: AvatarSize.md,
      height: AvatarSize.md,
      borderRadius: AvatarSize.md / 2,
      borderWidth: 1,
      borderColor: colors.border,
    },

    avatarFallback: {
      backgroundColor: colors.surfaceSecondary,
      alignItems: "center",
      justifyContent: "center",
    },

    userText: {
      flex: 1,
      gap: 2,
    },

    displayName: {
      fontFamily: FontFamily.semiBold,
      fontSize: FontSize.body,
      color: colors.textPrimary,
    },

    username: {
      fontFamily: FontFamily.regular,
      fontSize: FontSize.label,
      color: colors.textSecondary,
    },

    divider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: colors.border,
      marginBottom: Spacing.md,
    },

    navSection: {
      gap: Spacing.xs,
    },

    navItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.md,
      paddingVertical: Spacing.md,
      paddingHorizontal: Spacing.sm,
      borderRadius: Radius.md,
    },

    navItemPressed: {
      backgroundColor: colors.surfaceSecondary,
    },

    navIconWrap: {
      width: 36,
      height: 36,
      borderRadius: Radius.sm,
      backgroundColor: colors.surfaceSecondary,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: "center",
      justifyContent: "center",
    },

    navLabel: {
      flex: 1,
      fontFamily: FontFamily.medium,
      fontSize: FontSize.body,
      color: colors.textPrimary,
    },

    spacer: {
      flex: 1,
    },

    signOutButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.md,
      paddingVertical: Spacing.md,
      paddingHorizontal: Spacing.sm,
      borderRadius: Radius.md,
    },

    signOutButtonPressed: {
      backgroundColor: colors.dangerSubtle,
    },

    signOutLabel: {
      color: colors.danger,
      flex: 1,
    },
  });
}
