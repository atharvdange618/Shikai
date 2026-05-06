import { Octicons } from "@expo/vector-icons";
import Constants from "expo-constants";
import { Image } from "expo-image";
import {
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";

import {
  DarkColors,
  FontFamily,
  FontSize,
  IconSize,
  Layout,
  LightColors,
  Radius,
  Shadows,
  Spacing,
} from "@/constants/theme";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";

const APP_VERSION = Constants.expoConfig?.version ?? "1.0.0";

export default function AboutScreen() {
  const isDark = useColorScheme() === "dark";
  const colors = isDark ? DarkColors : LightColors;
  const shadows = isDark ? {} : Shadows.light.sm;

  const s = buildStyles(colors, shadows);

  return (
    <ScrollView
      style={s.scroll}
      contentContainerStyle={s.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={s.heroSection}>
        <Image
          source={require("@/assets/images/splash-icon.png")}
          style={s.logoImage}
          contentFit="contain"
          transition={200}
        />
        <Text style={s.appName}>Shikai</Text>
        <Text style={s.tagline}>Your GitHub dashboard, at a glance.</Text>
        <View style={s.versionBadge}>
          <Text style={s.versionText}>v{APP_VERSION}</Text>
        </View>
      </View>

      <View style={s.sectionGroup}>
        <Text style={s.sectionTitle}>About Me</Text>
        <View style={s.card}>
          <View style={s.devBlock}>
            <Image
              source={{ uri: "https://github.com/atharvdange618.png" }}
              style={s.devAvatar}
              contentFit="cover"
              transition={200}
            />
            <View style={s.devInfo}>
              <Text style={s.devName}>Atharv Dange</Text>
              <Text style={s.devHandle}>@atharvdangedev</Text>
            </View>
          </View>
          <View style={s.divider} />
          <Text style={s.bodyText}>
            I&apos;m full-stack engineer who loves building tools/products that
            make my life as a dev easier. I created Shikai to provide a
            beautiful mobile experience for GitHub users.
          </Text>
          <View style={s.divider} />
          <Pressable
            style={({ pressed }) => [s.linkRow, pressed && { opacity: 0.7 }]}
            onPress={() => Linking.openURL("https://github.com/atharvdange618")}
          >
            <Octicons
              name="mark-github"
              size={IconSize.sm}
              color={colors.accent}
            />
            <Text style={s.linkText}>atharvdange618</Text>
            <Octicons name="link-external" size={12} color={colors.textMuted} />
          </Pressable>
          <Pressable
            style={({ pressed }) => [s.linkRow, pressed && { opacity: 0.7 }]}
            onPress={() => Linking.openURL("https://x.com/atharvdangedev")}
          >
            <FontAwesome6
              name="x-twitter"
              size={IconSize.sm}
              color={colors.accent}
            />
            <Text style={s.linkText}>atharvdangedev</Text>
            <Octicons name="link-external" size={12} color={colors.textMuted} />
          </Pressable>
        </View>
      </View>

      <View style={s.sectionGroup}>
        <Text style={s.sectionTitle}>About the App</Text>
        <View style={s.card}>
          <Text style={s.bodyText}>
            Shikai brings GitHub&apos;s web experience to mobile. The official
            GitHub app is great for reviews and issues, but it&apos;s missing
            the web features developers love.
          </Text>
          <View style={s.divider} />
          <Text style={s.bodyText}>
            Pinned repositories, contribution graphs, recent activity - these
            make GitHub&apos;s web version so useful. Shikai delivers that same
            experience, beautifully crafted for mobile.
          </Text>
          <View style={s.divider} />
        </View>
      </View>

      <View style={s.footer}>
        <Text style={s.footerText}>
          Built with care for the developer community
        </Text>
        <Text style={s.footerSubtext}>
          Read-only · No data leaves your device
        </Text>
      </View>
    </ScrollView>
  );
}

function buildStyles(
  colors: typeof LightColors | typeof DarkColors,
  shadows: object,
) {
  return StyleSheet.create({
    scroll: {
      flex: 1,
      backgroundColor: colors.background,
    },

    content: {
      paddingHorizontal: Layout.screenPadding,
      paddingTop: Spacing.xl,
      paddingBottom: Spacing.xxl,
      gap: Spacing.xl,
    },

    heroSection: {
      alignItems: "center",
      gap: Spacing.md,
    },

    logoImage: {
      width: 96,
      height: 96,
      borderRadius: 24,
    },

    appName: {
      fontFamily: FontFamily.bold,
      fontSize: FontSize.display,
      color: colors.textPrimary,
    },

    tagline: {
      fontFamily: FontFamily.regular,
      fontSize: FontSize.body,
      color: colors.textSecondary,
      textAlign: "center",
    },

    versionBadge: {
      backgroundColor: colors.surfaceSecondary,
      borderRadius: Radius.full,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.xs,
    },

    versionText: {
      fontFamily: FontFamily.medium,
      fontSize: FontSize.caption,
      color: colors.textMuted,
    },

    sectionGroup: {
      gap: Spacing.md,
    },

    sectionTitle: {
      fontFamily: FontFamily.medium,
      fontSize: FontSize.label,
      color: colors.textMuted,
      textTransform: "uppercase",
      letterSpacing: 0.6,
      paddingHorizontal: Spacing.xs,
    },

    card: {
      backgroundColor: colors.surface,
      borderRadius: Radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      padding: Spacing.lg,
      gap: Spacing.md,
      ...shadows,
    },

    bodyText: {
      fontFamily: FontFamily.regular,
      fontSize: FontSize.body,
      color: colors.textSecondary,
      lineHeight: FontSize.body * 1.6,
    },

    divider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: colors.border,
    },

    featureList: {
      gap: Spacing.sm,
    },

    checkDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
    },

    featureText: {
      flex: 1,
      fontFamily: FontFamily.regular,
      fontSize: FontSize.body,
      color: colors.textSecondary,
    },

    sectionSubtitle: {
      fontFamily: FontFamily.medium,
      fontSize: FontSize.label,
      color: colors.textMuted,
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },

    devBlock: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.md,
    },

    devAvatar: {
      width: 56,
      height: 56,
      borderRadius: 28,
      borderWidth: 2,
      borderColor: colors.border,
    },

    devInfo: {
      flex: 1,
      gap: 2,
    },

    devName: {
      fontFamily: FontFamily.semiBold,
      fontSize: FontSize.title,
      color: colors.textPrimary,
    },

    devHandle: {
      fontFamily: FontFamily.regular,
      fontSize: FontSize.caption,
      color: colors.textSecondary,
    },

    linkRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.md,
      paddingVertical: Spacing.xs,
    },

    linkText: {
      flex: 1,
      fontFamily: FontFamily.regular,
      fontSize: FontSize.body,
      color: colors.accent,
    },

    footer: {
      alignItems: "center",
      gap: Spacing.sm,
      paddingTop: Spacing.xl,
    },

    footerText: {
      fontFamily: FontFamily.medium,
      fontSize: FontSize.caption,
      color: colors.textMuted,
    },

    footerSubtext: {
      fontFamily: FontFamily.regular,
      fontSize: FontSize.caption,
      color: colors.textMuted,
    },
  });
}
