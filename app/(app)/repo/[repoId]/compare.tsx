import { ErrorBoundary } from "@/components";
import { DiffCommitList } from "@/components/repo/DiffCommitList";
import { DiffFileList } from "@/components/repo/DiffFileList";
import {
  FontFamily,
  FontSize,
  IconSize,
  Layout,
  Radius,
  Spacing,
  useTheme,
} from "@/constants/theme";
import { useComparison } from "@/hooks/useComparison";
import { decodeRepoId } from "@/lib/utils";
import { Octicons } from "@expo/vector-icons";
import { useLocalSearchParams, useNavigation } from "expo-router";
import { useEffect } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

export default function CompareScreen() {
  return (
    <ErrorBoundary fallback="back">
      <CompareScreenContent />
    </ErrorBoundary>
  );
}

function CompareScreenContent() {
  const { repoId, base, head } = useLocalSearchParams<{
    repoId: string;
    base: string;
    head: string;
  }>();
  const navigation = useNavigation();
  const { colors } = useTheme();

  const [owner, repoName] = decodeRepoId(repoId ?? "");

  const { data, isLoading, isError } = useComparison(
    owner,
    repoName,
    base ?? "",
    head ?? "",
  );

  useEffect(() => {
    try {
      navigation.setOptions({ title: "Compare" });
    } catch {}
  }, [navigation]);

  if (isLoading) {
    return (
      <View style={[s.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  if (isError || !data) {
    return (
      <View style={[s.centered, { backgroundColor: colors.background }]}>
        <Octicons name="alert" size={IconSize.xl} color={colors.danger} />
        <Text style={[s.emptyTitle, { color: colors.textSecondary }]}>
          Failed to load comparison
        </Text>
      </View>
    );
  }

  const additions = data.files.reduce((sum, f) => sum + f.additions, 0);
  const deletions = data.files.reduce((sum, f) => sum + f.deletions, 0);

  return (
    <ScrollView
      style={[s.scroll, { backgroundColor: colors.background }]}
      contentContainerStyle={s.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={s.refRow}>
        <Octicons name="git-compare" size={20} color={colors.textMuted} />
        <Text
          style={[s.refText, { color: colors.textPrimary }]}
          numberOfLines={2}
        >
          {base} <Text style={{ color: colors.textMuted }}>…</Text> {head}
        </Text>
      </View>

      <View style={s.metaRow}>
        <Text style={[s.metaText, { color: colors.textSecondary }]}>
          {data.total_commits} commit{data.total_commits === 1 ? "" : "s"}
        </Text>
        <Text style={[s.diffStat]}>
          <Text style={{ color: colors.success }}>+{additions}</Text>{" "}
          <Text style={{ color: colors.danger }}>-{deletions}</Text>
        </Text>
      </View>

      {data.status === "identical" || data.total_commits === 0 ? (
        <View
          style={[
            s.bodySection,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <Text style={[s.metaText, { color: colors.textMuted }]}>
            {head} is up to date with {base}. Nothing to compare.
          </Text>
        </View>
      ) : (
        <>
          {data.commits.length > 0 && (
            <DiffCommitList
              commits={data.commits}
              colors={colors}
              repoId={repoId ?? ""}
            />
          )}
          {data.files.length > 0 && (
            <DiffFileList
              files={data.files}
              colors={colors}
              repoContext={`${owner}/${repoName}`}
            />
          )}
        </>
      )}

      <View style={{ height: Spacing.xxl + 60 + Spacing.lg }} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Layout.screenPadding,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xxl + 60 + Spacing.lg,
    gap: Spacing.md,
    maxWidth: 680,
    width: "100%",
    alignSelf: "center",
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.md,
  },
  emptyTitle: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.body,
  },
  refRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.sm,
  },
  refText: {
    flex: 1,
    fontFamily: FontFamily.mono,
    fontSize: FontSize.label,
    lineHeight: FontSize.label * 1.4,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  metaText: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.caption,
  },
  diffStat: {
    fontFamily: FontFamily.mono,
    fontSize: 11,
  },
  bodySection: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Radius.lg,
    padding: Spacing.md,
  },
});
