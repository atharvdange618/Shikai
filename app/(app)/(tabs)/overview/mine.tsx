import { Octicons } from "@expo/vector-icons";
import { useCallback, useMemo, useState } from "react";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { IssueResultCard } from "@/components/shared/IssueResultCard";
import { type MyWorkSectionKey, useMyWork } from "@/hooks/useMyWork";

import {
  type ColorTokens,
  FontFamily,
  FontSize,
  Radius,
  Spacing,
  useTheme,
} from "@/constants/theme";

export default function MyWorkScreen() {
  const { colors } = useTheme();
  const { sections, isLoading, isError, refetch } = useMyWork();
  const [refreshing, setRefreshing] = useState(false);
  const [collapsed, setCollapsed] = useState<Set<MyWorkSectionKey>>(new Set());

  const s = useMemo(() => buildStyles(colors), [colors]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const toggle = useCallback((key: MyWorkSectionKey) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  if (isError) {
    return (
      <View style={s.centered}>
        <Octicons name="alert" size={40} color={colors.danger} />
        <Text style={s.emptyTitle}>Couldn{"'"}t load your work</Text>
        <Pressable style={s.retry} onPress={() => refetch()}>
          <Text style={s.retryText}>Try again</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView
      style={s.container}
      contentContainerStyle={s.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.accent}
          colors={[colors.accent]}
        />
      }
    >
      {sections.map((section) => {
        const isCollapsed = collapsed.has(section.key);
        return (
          <View key={section.key} style={s.section}>
            <Pressable
              style={({ pressed }) => [s.header, pressed && { opacity: 0.7 }]}
              onPress={() => toggle(section.key)}
            >
              <Octicons
                name={isCollapsed ? "chevron-right" : "chevron-down"}
                size={16}
                color={colors.textMuted}
              />
              <Text style={s.headerTitle}>{section.title}</Text>
              <View style={s.countBadge}>
                <Text style={s.countText}>{section.totalCount}</Text>
              </View>
            </Pressable>

            {!isCollapsed &&
              (isLoading ? (
                <View style={s.sectionBody}>
                  {Array.from({ length: 2 }).map((_, i) => (
                    <View key={i} style={s.skeleton} />
                  ))}
                </View>
              ) : section.issues.length === 0 ? (
                <Text style={s.emptyLine}>Nothing here right now</Text>
              ) : (
                <View style={s.sectionBody}>
                  {section.issues.map((issue) => (
                    <IssueResultCard
                      key={issue.id}
                      issue={issue}
                      colors={colors}
                    />
                  ))}
                </View>
              ))}
          </View>
        );
      })}
    </ScrollView>
  );
}

function buildStyles(colors: ColorTokens) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      padding: Spacing.lg,
      gap: Spacing.xl,
      paddingBottom: Spacing.xxl,
    },
    section: {
      gap: Spacing.sm,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.sm,
    },
    headerTitle: {
      flex: 1,
      fontFamily: FontFamily.semiBold,
      fontSize: FontSize.body,
      color: colors.textPrimary,
    },
    countBadge: {
      minWidth: 22,
      paddingHorizontal: Spacing.xs,
      height: 20,
      borderRadius: Radius.full,
      backgroundColor: colors.surfaceSecondary,
      alignItems: "center",
      justifyContent: "center",
    },
    countText: {
      fontFamily: FontFamily.medium,
      fontSize: FontSize.caption,
      color: colors.textMuted,
    },
    sectionBody: {
      gap: Spacing.sm,
    },
    skeleton: {
      height: 72,
      borderRadius: Radius.lg,
      backgroundColor: colors.surfaceSecondary,
    },
    emptyLine: {
      fontFamily: FontFamily.regular,
      fontSize: FontSize.label,
      color: colors.textMuted,
      paddingLeft: Spacing.lg,
    },
    centered: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      gap: Spacing.md,
      backgroundColor: colors.background,
    },
    emptyTitle: {
      fontFamily: FontFamily.semiBold,
      fontSize: FontSize.title,
      color: colors.textPrimary,
    },
    retry: {
      backgroundColor: colors.accent,
      borderRadius: Radius.md,
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.sm,
    },
    retryText: {
      fontFamily: FontFamily.semiBold,
      fontSize: FontSize.body,
      color: "#FFFFFF",
    },
  });
}
