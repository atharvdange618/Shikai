import { Octicons } from "@expo/vector-icons";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import Constants from "expo-constants";
import { Image } from "expo-image";
import { useMemo } from "react";
import {
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  FontFamily,
  FontSize,
  IconSize,
  Layout,
  Radius,
  Shadows,
  Spacing,
  useTheme,
  type ColorTokens,
} from "@/constants/theme";

const APP_VERSION = Constants.expoConfig?.version ?? "1.0.0";

const FEATURES = [
  { icon: "repo" as const, text: "Browse repos, files, and branches" },
  { icon: "graph" as const, text: "Contribution graphs and streaks" },
  {
    icon: "bell" as const,
    text: "Notifications tab with unread badge and swipe to mark read",
  },
  {
    icon: "people" as const,
    text: "Following activity feed from followed users",
  },
  {
    icon: "issue-opened" as const,
    text: "Issue and PR detail, with diffs, checks, reviewers, and commits",
  },
  { icon: "history" as const, text: "Commit history per branch" },
  { icon: "markdown" as const, text: "In-app README and markdown preview" },
  {
    icon: "search" as const,
    text: "Global search across repos, users, issues, and topics",
  },
  { icon: "clock" as const, text: "Recent searches saved for quick access" },
  { icon: "bookmark" as const, text: "Saved repos with Stars and Watchlist" },
  {
    icon: "paintbrush" as const,
    text: "5 themes: Light, Dark, Tokyo Night, Dracula, Atom One",
  },
  { icon: "key" as const, text: "PAT support for notifications and following" },
  { icon: "keyboard" as const, text: "Keyboard shortcuts for iPad/macOS" },
  { icon: "signal" as const, text: "Offline support with disk caching" },
  {
    icon: "device-mobile" as const,
    text: "Overview screen widget with contribution streak",
  },
  { icon: "sync" as const, text: "OTA updates with a restart prompt" },
  {
    icon: "file" as const,
    text: "SVG, PDF, and video rendering in file viewer",
  },
  {
    icon: "pulse" as const,
    text: "Haptic feedback and reduced-motion support",
  },
  {
    icon: "lock" as const,
    text: "Read-only \u00B7 No data leaves your device",
  },
];

const CREDITS = [
  { name: "Expo", url: "https://expo.dev", desc: "React Native toolchain" },
  {
    name: "FlashList",
    url: "https://shopify.github.io/flash-list/",
    desc: "High-performance virtualized lists",
  },
  {
    name: "React Query",
    url: "https://tanstack.com/query",
    desc: "Server state management",
  },
  {
    name: "Zustand",
    url: "https://zustand-demo.pmnd.rs",
    desc: "Lightweight state management",
  },
  {
    name: "Reanimated",
    url: "https://docs.swmansion.com/react-native-reanimated/",
    desc: "Fluid animations",
  },
];

export default function AboutScreen() {
  const { colors, isDark } = useTheme();
  const shadows = useMemo(() => (isDark ? {} : Shadows.light.sm), [isDark]);

  const s = useMemo(() => buildStyles(colors, shadows), [colors, shadows]);

  return (
    <ScrollView
      style={s.scroll}
      contentContainerStyle={s.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={s.heroSection}>
        <View style={s.logoMark}>
          <Image
            source={
              isDark
                ? require("@/assets/images/splash-icon-dark.png")
                : require("@/assets/images/splash-icon.png")
            }
            style={s.logoImage}
            contentFit="contain"
            transition={200}
          />
        </View>
        <Text style={s.appName}>Shikai</Text>
        <Text style={s.tagline}>Your GitHub dashboard, at a glance.</Text>
        <View style={s.versionBadge}>
          <Text style={s.versionText}>v{APP_VERSION}</Text>
        </View>
      </View>

      <View style={s.card}>
        <Text style={s.cardTitle}>Features</Text>
        {FEATURES.map((f, i) => (
          <View key={i} style={s.featureRow}>
            <View style={s.featureDot} />
            <Text style={s.featureText}>{f.text}</Text>
          </View>
        ))}
      </View>

      <View style={s.card}>
        <Text style={s.cardTitle}>About</Text>
        <Text style={s.bodyText}>
          Shikai brings GitHub&apos;s web experience to mobile. Pinned repos,
          contribution graphs, recent activity, the features that make
          GitHub&apos;s web version so useful, beautifully crafted for mobile.
        </Text>
        <View style={s.divider} />
        <Text style={s.bodyText}>
          Built by a developer who wanted a better way to check GitHub on the
          go. Read-only by design, your data never leaves your device.
        </Text>
      </View>

      <View style={s.card}>
        <Text style={s.cardTitle}>Developer</Text>
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
        <Pressable
          style={({ pressed }) => [s.linkRow, pressed && { opacity: 0.7 }]}
          onPress={() => Linking.openURL("https://atharvdangedev.in")}
        >
          <Octicons name="globe" size={IconSize.sm} color={colors.accent} />
          <Text style={s.linkText}>atharvdangedev.in</Text>
          <Octicons name="link-external" size={12} color={colors.textMuted} />
        </Pressable>
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
          <Text style={s.linkText}>@atharvdangedev</Text>
          <Octicons name="link-external" size={12} color={colors.textMuted} />
        </Pressable>
      </View>

      <View style={s.card}>
        <Text style={s.cardTitle}>Open Source</Text>
        <Text style={s.bodyText}>
          Shikai is open source. Found a bug or want to contribute? Check out
          the repository on GitHub.
        </Text>
        <Pressable
          style={({ pressed }) => [
            s.openSourceButton,
            pressed && { opacity: 0.7 },
          ]}
          onPress={() =>
            Linking.openURL("https://github.com/atharvdange618/shikai")
          }
        >
          <Octicons
            name="mark-github"
            size={IconSize.sm}
            color={colors.textPrimary}
          />
          <Text style={s.openSourceButtonText}>View on GitHub</Text>
          <Octicons name="link-external" size={12} color={colors.textMuted} />
        </Pressable>
        <View style={s.divider} />
        <Text style={s.bodyText}>
          Enjoying Shikai? A star on the repo helps others discover it and keeps
          the project going.
        </Text>
        <Pressable
          style={({ pressed }) => [s.starButton, pressed && { opacity: 0.7 }]}
          onPress={() =>
            Linking.openURL("https://github.com/atharvdange618/shikai#readme")
          }
        >
          <Octicons name="star" size={IconSize.sm} color={colors.accent} />
          <Text style={s.starButtonText}>Star on GitHub</Text>
        </Pressable>
      </View>

      <View style={s.card}>
        <Text style={s.cardTitle}>Credits</Text>
        <Text style={[s.bodyText, { marginBottom: Spacing.xs }]}>
          Built with these amazing open source libraries:
        </Text>
        {CREDITS.map((lib, i) => (
          <Pressable
            key={i}
            style={({ pressed }) => [s.linkRow, pressed && { opacity: 0.7 }]}
            onPress={() => Linking.openURL(lib.url)}
          >
            <Text style={s.creditName}>{lib.name}</Text>
            <Text style={s.creditDesc}>{lib.desc}</Text>
            <Octicons name="link-external" size={12} color={colors.textMuted} />
          </Pressable>
        ))}
      </View>

      <View style={s.footer}>
        <Text style={s.footerText}>
          Built with care for the developer community
        </Text>
      </View>
    </ScrollView>
  );
}

function buildStyles(colors: ColorTokens, shadows: object) {
  return StyleSheet.create({
    scroll: {
      flex: 1,
      backgroundColor: colors.background,
    },

    content: {
      paddingHorizontal: Layout.screenPadding,
      paddingTop: Spacing.xl,
      paddingBottom: Spacing.xxl,
      gap: Spacing.lg,
      maxWidth: 680,
      width: "100%",
      alignSelf: "center",
    },

    heroSection: {
      alignItems: "center",
      gap: Spacing.md,
      paddingVertical: Spacing.xl,
    },

    logoMark: {
      width: 96,
      height: 96,
      borderRadius: 24,
      backgroundColor: colors.accentSubtle,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: colors.border,
      overflow: "hidden",
      ...shadows,
    },

    logoImage: {
      width: 120,
      height: 120,
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

    card: {
      backgroundColor: colors.surface,
      borderRadius: Radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      padding: Spacing.lg,
      gap: Spacing.sm,
      ...shadows,
    },

    cardTitle: {
      fontFamily: FontFamily.semiBold,
      fontSize: FontSize.title,
      color: colors.textPrimary,
      marginBottom: Spacing.xs,
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
      marginVertical: Spacing.xs,
    },

    featureRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.md,
      paddingVertical: 2,
    },

    featureDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: colors.accent,
    },

    featureText: {
      flex: 1,
      fontFamily: FontFamily.regular,
      fontSize: FontSize.body,
      color: colors.textSecondary,
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

    openSourceButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: Spacing.sm,
      backgroundColor: colors.surfaceSecondary,
      borderRadius: Radius.md,
      padding: Spacing.md,
      marginTop: Spacing.xs,
    },

    openSourceButtonText: {
      fontFamily: FontFamily.medium,
      fontSize: FontSize.body,
      color: colors.textPrimary,
    },

    starButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: Spacing.sm,
      backgroundColor: colors.surfaceSecondary,
      borderRadius: Radius.md,
      padding: Spacing.md,
      marginTop: Spacing.xs,
    },

    starButtonText: {
      fontFamily: FontFamily.medium,
      fontSize: FontSize.body,
      color: colors.accent,
    },

    creditName: {
      fontFamily: FontFamily.medium,
      fontSize: FontSize.body,
      color: colors.accent,
      minWidth: 120,
    },

    creditDesc: {
      flex: 1,
      fontFamily: FontFamily.regular,
      fontSize: FontSize.caption,
      color: colors.textMuted,
    },

    footer: {
      alignItems: "center",
      paddingTop: Spacing.md,
      paddingBottom: Spacing.lg,
    },

    footerText: {
      fontFamily: FontFamily.medium,
      fontSize: FontSize.caption,
      color: colors.textMuted,
    },
  });
}
