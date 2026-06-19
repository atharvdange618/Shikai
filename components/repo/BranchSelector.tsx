import { Octicons } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useColorScheme,
} from "react-native";

import {
  BorderWidth,
  DarkColors,
  FontFamily,
  FontSize,
  IconSize,
  LightColors,
  Radius,
  Shadows,
  Spacing,
} from "@/constants/theme";
import type { GitHubBranch } from "@/types/github.types";

interface BranchSelectorProps {
  branches: GitHubBranch[];
  selectedBranch: string;
  onBranchChange: (branch: string) => void;
  isLoading?: boolean;
}

export function BranchSelector({
  branches,
  selectedBranch,
  onBranchChange,
  isLoading,
}: BranchSelectorProps) {
  const isDark = useColorScheme() === "dark";
  const colors = isDark ? DarkColors : LightColors;
  const s = useMemo(
    () => buildStyles(colors, isDark ? {} : Shadows.light.sm),
    [colors, isDark],
  );
  const [open, setOpen] = useState(false);

  if (isLoading) {
    return (
      <View style={s.loadingRow}>
        <ActivityIndicator size="small" color={colors.accent} />
        <Text style={s.loadingText}>Loading branches...</Text>
      </View>
    );
  }

  if (branches.length <= 1) return null;

  return (
    <View style={s.wrapper}>
      <Pressable
        onPress={() => setOpen((prev) => !prev)}
        style={({ pressed }) => [
          s.trigger,
          pressed && { backgroundColor: colors.surfaceSecondary },
        ]}
      >
        <Octicons
          name="git-branch"
          size={IconSize.xs}
          color={colors.textMuted}
        />
        <Text style={s.triggerText} numberOfLines={1}>
          {selectedBranch || "Select branch"}
        </Text>
        <Octicons
          name={open ? "chevron-up" : "chevron-down"}
          size={IconSize.xs}
          color={colors.textMuted}
        />
      </Pressable>

      {open && (
        <View style={s.dropdown}>
          <ScrollView
            style={s.dropdownScroll}
            showsVerticalScrollIndicator={false}
          >
            {branches.map((branch) => {
              const active = branch.name === selectedBranch;
              return (
                <Pressable
                  key={branch.name}
                  onPress={() => {
                    onBranchChange(branch.name);
                    setOpen(false);
                  }}
                  style={({ pressed }) => [
                    s.option,
                    active && { backgroundColor: colors.accentSubtle },
                    pressed && { backgroundColor: colors.surfaceSecondary },
                  ]}
                >
                  <Text
                    style={[
                      s.optionText,
                      { color: active ? colors.accent : colors.textPrimary },
                    ]}
                    numberOfLines={1}
                  >
                    {branch.name}
                  </Text>
                  {active && (
                    <Octicons
                      name="check"
                      size={IconSize.xs}
                      color={colors.accent}
                    />
                  )}
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

function buildStyles(
  colors: typeof LightColors | typeof DarkColors,
  shadows: Record<string, any>,
) {
  return StyleSheet.create({
    wrapper: {
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.xs,
      zIndex: 10,
    },
    trigger: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.xs,
      backgroundColor: colors.surface,
      borderWidth: BorderWidth.normal,
      borderColor: colors.border,
      borderRadius: Radius.md,
      paddingHorizontal: Spacing.sm,
      paddingVertical: Spacing.xs + 2,
    },
    triggerText: {
      flex: 1,
      fontFamily: FontFamily.medium,
      fontSize: FontSize.label,
      color: colors.textPrimary,
    },
    dropdown: {
      position: "absolute",
      top: "100%",
      left: Spacing.md,
      right: Spacing.md,
      marginTop: Spacing.xs,
      backgroundColor: colors.surface,
      borderWidth: BorderWidth.normal,
      borderColor: colors.border,
      borderRadius: Radius.md,
      maxHeight: 220,
      overflow: "hidden",
      ...shadows,
    },
    dropdownScroll: {
      maxHeight: 220,
    },
    option: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: colors.surface,
      paddingHorizontal: Spacing.sm,
      paddingVertical: Spacing.xs + 2,
    },
    optionText: {
      fontFamily: FontFamily.regular,
      fontSize: FontSize.label,
      flex: 1,
    },
    loadingRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.xs,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.xs,
    },
    loadingText: {
      fontFamily: FontFamily.regular,
      fontSize: FontSize.caption,
      color: colors.textMuted,
    },
  });
}
