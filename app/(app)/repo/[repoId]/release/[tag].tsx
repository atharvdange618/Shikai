import { ErrorBoundary } from "@/components";
import { MarkdownRenderer } from "@/components/shared/MarkdownRenderer";
import {
  type ColorTokens,
  FontFamily,
  FontSize,
  IconSize,
  Layout,
  Radius,
  Spacing,
  useTheme,
  ZIndex,
} from "@/constants/theme";
import { useRelease, useReleases } from "@/hooks/useReleases";
import { decodeRepoId, formatBytes, relativeTime } from "@/lib/utils";
import { Octicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { Image } from "expo-image";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, {
  FadeIn,
  FadeOut,
  SlideInDown,
  SlideOutDown,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// What the action menu needs from an asset or a source archive.
type DownloadTarget = { name: string; url: string };

export default function ReleaseDetailScreen() {
  return (
    <ErrorBoundary fallback="back">
      <ReleaseDetailScreenContent />
    </ErrorBoundary>
  );
}

function ReleaseDetailScreenContent() {
  const { repoId, tag } = useLocalSearchParams<{ repoId: string; tag: string }>();
  const navigation = useNavigation();
  const router = useRouter();
  const { colors } = useTheme();

  const [menuTarget, setMenuTarget] = useState<DownloadTarget | null>(null);

  const [owner, repoName] = decodeRepoId(repoId ?? "");

  const { data: release, isLoading, isError } = useRelease(
    owner,
    repoName,
    tag ?? "",
  );

  // Best-effort: only resolves if the previous tag is in the loaded pages.
  const { releases } = useReleases(owner, repoName);
  const prevTag = useMemo(() => {
    const i = releases.findIndex((r) => r.tag_name === tag);
    return i >= 0 ? (releases[i + 1]?.tag_name ?? null) : null;
  }, [releases, tag]);

  useEffect(() => {
    try {
      navigation.setOptions({ title: tag ?? "Release" });
    } catch {}
  }, [navigation, tag]);

  const sourceTargets: DownloadTarget[] = useMemo(() => {
    if (!release) return [];
    const archive = `https://github.com/${owner}/${repoName}/archive/refs/tags/${release.tag_name}`;
    return [
      { name: "Source code (zip)", url: `${archive}.zip` },
      { name: "Source code (tar.gz)", url: `${archive}.tar.gz` },
    ];
  }, [release, owner, repoName]);

  if (isLoading) {
    return (
      <View style={[s.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  if (isError || !release) {
    return (
      <View style={[s.centered, { backgroundColor: colors.background }]}>
        <Octicons name="alert" size={IconSize.xl} color={colors.danger} />
        <Text style={[s.emptyTitle, { color: colors.textSecondary }]}>
          Failed to load release
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={[s.scroll, { backgroundColor: colors.background }]}
      contentContainerStyle={s.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={s.titleRow}>
        <Octicons name="tag" size={22} color={colors.textMuted} />
        <Text style={[s.title, { color: colors.textPrimary }]} numberOfLines={4}>
          {release.name?.trim() || release.tag_name}
        </Text>
      </View>

      {release.author && (
        <View style={s.authorBar}>
          <Image
            source={{ uri: release.author.avatar_url }}
            style={s.authorAvatar}
            contentFit="cover"
            transition={100}
          />
          <Text style={[s.authorName, { color: colors.textPrimary }]}>
            {release.author.login}
          </Text>
          <Text style={[s.metaText, { color: colors.textMuted }]}>
            released this
          </Text>
        </View>
      )}

      <View style={s.metaRow}>
        {release.prerelease && (
          <View style={[s.badge, { backgroundColor: colors.surfaceSecondary }]}>
            <Text style={[s.badgeText, { color: colors.warning }]}>
              Pre-release
            </Text>
          </View>
        )}
        <Text style={[s.metaText, { color: colors.textMuted }]}>
          {release.tag_name} · {relativeTime(release.published_at)}
        </Text>
      </View>

      {prevTag && (
        <Pressable
          style={({ pressed }) => [
            s.compareLink,
            { borderColor: colors.border },
            pressed && { backgroundColor: colors.surfaceSecondary },
          ]}
          onPress={() =>
            router.push({
              pathname: "/(app)/repo/[repoId]/compare",
              params: { repoId: repoId ?? "", base: prevTag, head: release.tag_name },
            })
          }
        >
          <Octicons name="git-compare" size={14} color={colors.accent} />
          <Text style={[s.compareText, { color: colors.accent }]}>
            Compare to {prevTag}
          </Text>
        </Pressable>
      )}

      {release.body?.trim() ? (
        <View
          style={[
            s.bodySection,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <MarkdownRenderer
            markdown={release.body}
            context={`${owner}/${repoName}`}
          />
        </View>
      ) : (
        <Text style={[s.metaText, { color: colors.textMuted }]}>
          No release notes.
        </Text>
      )}

      <View
        style={[
          s.card,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        <Text style={[s.cardHeader, { color: colors.textPrimary }]}>
          Assets ({release.assets.length + sourceTargets.length})
        </Text>
        {release.assets.map((asset) => (
          <AssetRow
            key={asset.name}
            icon="file-zip"
            name={asset.name}
            meta={`${formatBytes(asset.size)} · ${asset.download_count} download${
              asset.download_count === 1 ? "" : "s"
            }`}
            colors={colors}
            onPress={() => Linking.openURL(asset.browser_download_url)}
            onMenu={() =>
              setMenuTarget({
                name: asset.name,
                url: asset.browser_download_url,
              })
            }
          />
        ))}
        {sourceTargets.map((src) => (
          <AssetRow
            key={src.name}
            icon="file-code"
            name={src.name}
            colors={colors}
            onPress={() => Linking.openURL(src.url)}
            onMenu={() => setMenuTarget(src)}
          />
        ))}
      </View>

      <View style={{ height: Spacing.xxl + 60 + Spacing.lg }} />

      <AssetActionMenu
        target={menuTarget}
        colors={colors}
        onClose={() => setMenuTarget(null)}
      />
    </ScrollView>
  );
}

function AssetRow({
  icon,
  name,
  meta,
  colors,
  onPress,
  onMenu,
}: {
  icon: React.ComponentProps<typeof Octicons>["name"];
  name: string;
  meta?: string;
  colors: ColorTokens;
  onPress: () => void;
  onMenu: () => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        s.assetRow,
        { borderTopColor: colors.border },
        pressed && { backgroundColor: colors.surfaceSecondary },
      ]}
      onPress={onPress}
    >
      <Octicons name={icon} size={14} color={colors.textMuted} />
      <View style={{ flex: 1, gap: 2 }}>
        <Text
          style={[s.assetName, { color: colors.textPrimary }]}
          numberOfLines={1}
        >
          {name}
        </Text>
        {meta ? (
          <Text style={[s.assetMeta, { color: colors.textMuted }]}>{meta}</Text>
        ) : null}
      </View>
      <Pressable
        onPress={onMenu}
        hitSlop={10}
        accessibilityRole="button"
        accessibilityLabel={`Actions for ${name}`}
      >
        <Octicons name="kebab-horizontal" size={16} color={colors.textMuted} />
      </Pressable>
    </Pressable>
  );
}

function AssetActionMenu({
  target,
  colors,
  onClose,
}: {
  target: DownloadTarget | null;
  colors: ColorTokens;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  const [copied, setCopied] = useState(false);

  if (!target) return null;

  const run = (fn: () => void) => {
    onClose();
    fn();
  };

  const handleCopy = async () => {
    await Clipboard.setStringAsync(target.url);
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
      onClose();
    }, 1200);
  };

  return (
    <Modal
      visible
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <Animated.View
        entering={FadeIn.duration(150)}
        exiting={FadeOut.duration(120)}
        style={[s.menuBackdrop, { backgroundColor: "rgba(0,0,0,0.4)" }]}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <Animated.View
          entering={SlideInDown.duration(220)}
          exiting={SlideOutDown.duration(140)}
          style={[
            s.menuSheet,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              paddingBottom: insets.bottom + Spacing.sm,
            },
          ]}
        >
          <Text
            style={[s.menuHeader, { color: colors.textMuted }]}
            numberOfLines={1}
          >
            {target.name}
          </Text>
          <Pressable
            style={({ pressed }) => [
              s.menuRow,
              pressed && { backgroundColor: colors.surfaceSecondary },
            ]}
            onPress={() => run(() => Share.share({ message: target.url }))}
          >
            <Octicons name="share" size={16} color={colors.textSecondary} />
            <Text style={[s.menuRowText, { color: colors.textPrimary }]}>
              Share
            </Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [
              s.menuRow,
              pressed && { backgroundColor: colors.surfaceSecondary },
            ]}
            onPress={handleCopy}
          >
            <Octicons
              name={copied ? "check" : "link"}
              size={16}
              color={copied ? colors.success : colors.textSecondary}
            />
            <Text
              style={[
                s.menuRowText,
                { color: copied ? colors.success : colors.textPrimary },
              ]}
            >
              {copied ? "Copied" : "Copy link"}
            </Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [
              s.menuRow,
              pressed && { backgroundColor: colors.surfaceSecondary },
            ]}
            onPress={() => run(() => Linking.openURL(target.url))}
          >
            <Octicons name="download" size={16} color={colors.textSecondary} />
            <Text style={[s.menuRowText, { color: colors.textPrimary }]}>
              Download
            </Text>
          </Pressable>
        </Animated.View>
      </Animated.View>
    </Modal>
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
  titleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.sm,
  },
  title: {
    flex: 1,
    fontFamily: FontFamily.bold,
    fontSize: FontSize.heading,
    lineHeight: FontSize.heading * 1.35,
  },
  authorBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  authorAvatar: {
    width: 22,
    height: 22,
    borderRadius: 11,
  },
  authorName: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.label,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  metaText: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.caption,
  },
  badge: {
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.xs + 2,
    paddingVertical: 2,
  },
  badgeText: {
    fontFamily: FontFamily.medium,
    fontSize: 10,
  },
  compareLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    alignSelf: "flex-start",
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs + 2,
  },
  compareText: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.caption,
  },
  bodySection: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Radius.lg,
    padding: Spacing.md,
  },
  card: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Radius.lg,
    overflow: "hidden",
  },
  cardHeader: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.label,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  assetRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  assetName: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.caption,
  },
  assetMeta: {
    fontFamily: FontFamily.regular,
    fontSize: 11,
  },
  menuBackdrop: {
    flex: 1,
    justifyContent: "flex-end",
    zIndex: ZIndex.modal,
    elevation: ZIndex.modal,
  },
  menuSheet: {
    borderTopWidth: 1,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    paddingTop: Spacing.md,
    paddingHorizontal: Spacing.sm,
    zIndex: ZIndex.modal + 1,
    elevation: ZIndex.modal + 1,
  },
  menuHeader: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.caption,
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.md,
  },
  menuRowText: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.body,
  },
});
