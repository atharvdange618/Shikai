import React, { useMemo } from "react";
import {
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
  LightColors,
  Radius,
  Spacing,
} from "@/constants/theme";
import type { RepoListParams } from "@/types/github.types";

export type SortOption = NonNullable<RepoListParams["sort"]>;
export type TypeOption = NonNullable<RepoListParams["type"]>;

interface RepoFiltersProps {
  sort: SortOption;
  type?: TypeOption;
  onSortChange: (sort: SortOption) => void;
  onTypeChange?: (type: TypeOption) => void;
}

const SORT_OPTIONS: { label: string; value: SortOption }[] = [
  { label: "Recently Pushed", value: "pushed" },
  { label: "Recently Created", value: "created" },
  { label: "Alphabetically", value: "full_name" },
];

const TYPE_OPTIONS: { label: string; value: TypeOption }[] = [
  { label: "All", value: "all" },
  { label: "Public", value: "public" },
  { label: "Private", value: "private" },
];

export function RepoFilters({
  sort,
  type,
  onSortChange,
  onTypeChange,
}: RepoFiltersProps) {
  const isDark = useColorScheme() === "dark";
  const colors = isDark ? DarkColors : LightColors;
  const s = React.useMemo(() => buildStyles(colors), [colors]);

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={s.container}
    >
      <View style={s.group}>
        <Text style={s.groupLabel}>Sort</Text>
        {SORT_OPTIONS.map((opt) => (
          <FilterPill
            key={opt.value}
            label={opt.label}
            active={sort === opt.value}
            onPress={() => onSortChange(opt.value)}
            colors={colors}
          />
        ))}
      </View>

      {type !== undefined && onTypeChange && (
        <>
          <View style={s.divider} />
          <View style={s.group}>
            <Text style={s.groupLabel}>Type</Text>
            {TYPE_OPTIONS.map((opt) => (
              <FilterPill
                key={opt.value}
                label={opt.label}
                active={type === opt.value}
                onPress={() => onTypeChange(opt.value)}
                colors={colors}
              />
            ))}
          </View>
        </>
      )}
    </ScrollView>
  );
}

function FilterPill({
  label,
  active,
  onPress,
  colors,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  colors: typeof LightColors | typeof DarkColors;
}) {
  const pillStyles = useMemo(
    () => ({
      base: {
        borderRadius: Radius.full,
        borderWidth: 1,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.xs,
        minHeight: 36,
        justifyContent: "center" as const,
      },
      active: {
        backgroundColor: colors.accent,
        borderColor: colors.accent,
      },
      inactive: {
        backgroundColor: colors.surface,
        borderColor: colors.border,
      },
      pressed: {
        backgroundColor: colors.surfaceSecondary,
        borderColor: colors.border,
      },
    }),
    [colors],
  );

  const textStyle = useMemo(
    () => ({
      fontFamily: FontFamily.medium,
      fontSize: FontSize.label,
      color: active ? "#FFFFFF" : colors.textSecondary,
    }),
    [active, colors],
  );

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        pillStyles.base,
        active
          ? pillStyles.active
          : pressed
            ? pillStyles.pressed
            : pillStyles.inactive,
      ]}
    >
      <Text style={textStyle}>{label}</Text>
    </Pressable>
  );
}

function buildStyles(colors: typeof LightColors | typeof DarkColors) {
  return StyleSheet.create({
    container: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.sm,
      paddingRight: Spacing.lg,
    },

    group: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.xs,
    },

    groupLabel: {
      fontFamily: FontFamily.medium,
      fontSize: FontSize.caption,
      color: colors.textMuted,
      marginRight: Spacing.xs,
    },

    divider: {
      width: 1,
      height: 20,
      backgroundColor: colors.border,
      marginHorizontal: Spacing.xs,
    },
  });
}
