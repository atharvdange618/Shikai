import { Octicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import {
  BorderWidth,
  FontFamily,
  FontSize,
  IconSize,
  Radius,
  Spacing,
  type ColorTokens,
} from "@/constants/theme";

interface RepoActionBarProps {
  isWatchlisted: boolean;
  copiedUrl: boolean;
  colors: ColorTokens;
  onCodePress: () => void;
  onCodePressIn: () => void;
  onCommitsPress: () => void;
  onCommitsPressIn: () => void;
  onShare: () => void;
  onShareLongPress: () => void;
  onBookmarkToggle: () => void;
}

export function RepoActionBar({
  isWatchlisted,
  copiedUrl,
  colors,
  onCodePress,
  onCodePressIn,
  onCommitsPress,
  onCommitsPressIn,
  onShare,
  onShareLongPress,
  onBookmarkToggle,
}: RepoActionBarProps) {
  const s = buildStyles(colors);

  return (
    <View style={s.actionRow}>
      <Pressable
        style={({ pressed }) => [
          s.actionButton,
          s.actionButtonOutline,
          pressed && s.actionButtonPressed,
        ]}
        onPress={onCodePress}
        onPressIn={onCodePressIn}
      >
        <Octicons name="code" size={IconSize.sm} color={colors.textPrimary} />
        <Text
          style={s.actionButtonOutlineText}
          numberOfLines={1}
          adjustsFontSizeToFit
        >
          Code
        </Text>
      </Pressable>

      <Pressable
        style={({ pressed }) => [
          s.actionButton,
          s.actionButtonFilled,
          pressed && s.actionButtonPressed,
        ]}
        onPress={onCommitsPress}
        onPressIn={onCommitsPressIn}
      >
        <Octicons
          name="history"
          size={IconSize.sm}
          color={colors.textOnAccent}
        />
        <Text
          style={s.actionButtonFilledText}
          numberOfLines={1}
          adjustsFontSizeToFit
        >
          Commits
        </Text>
      </Pressable>

      <Pressable
        style={({ pressed }) => [
          s.actionButton,
          s.actionButtonOutline,
          pressed && s.actionButtonPressed,
        ]}
        onPress={onShare}
        onLongPress={onShareLongPress}
        delayLongPress={400}
      >
        <Octicons
          name={copiedUrl ? "check" : "share"}
          size={IconSize.sm}
          color={copiedUrl ? colors.success : colors.textPrimary}
        />
        <Text
          style={[
            s.actionButtonOutlineText,
            copiedUrl && { color: colors.success },
          ]}
          numberOfLines={1}
          adjustsFontSizeToFit
        >
          {copiedUrl ? "Copied!" : "Share"}
        </Text>
      </Pressable>

      <Pressable
        style={({ pressed }) => [
          s.actionButtonIcon,
          isWatchlisted
            ? { backgroundColor: colors.accent, borderColor: colors.accent }
            : s.actionButtonOutline,
          pressed && s.actionButtonPressed,
        ]}
        onPress={onBookmarkToggle}
        accessibilityLabel={
          isWatchlisted ? "Remove from watchlist" : "Add to watchlist"
        }
        accessibilityRole="button"
      >
        <Octicons
          name={isWatchlisted ? "bookmark-slash" : "bookmark"}
          size={IconSize.sm}
          color={isWatchlisted ? colors.textOnAccent : colors.textPrimary}
        />
      </Pressable>
    </View>
  );
}

function buildStyles(colors: ColorTokens) {
  return StyleSheet.create({
    actionRow: {
      flexDirection: "row",
      gap: Spacing.sm,
    },

    actionButton: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      height: 44,
      borderRadius: Radius.md,
    },

    actionButtonIcon: {
      width: 44,
      height: 44,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: Radius.md,
      borderWidth: BorderWidth.normal,
      borderColor: colors.border,
    },

    actionButtonPressed: {
      opacity: 0.75,
      transform: [{ scale: 0.96 }],
    },

    actionButtonOutline: {
      borderWidth: BorderWidth.normal,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },

    actionButtonOutlineText: {
      fontFamily: FontFamily.semiBold,
      fontSize: FontSize.body,
      color: colors.textPrimary,
    },

    actionButtonFilled: {
      backgroundColor: colors.accent,
    },

    actionButtonFilledText: {
      fontFamily: FontFamily.semiBold,
      fontSize: FontSize.body,
      color: colors.textOnAccent,
    },
  });
}
