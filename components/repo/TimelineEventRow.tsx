import {
  type ColorTokens,
  FontFamily,
  FontSize,
  Radius,
  Spacing,
} from "@/constants/theme";
import type { EventItem } from "@/lib/timeline";
import { encodeRepoId, relativeTime } from "@/lib/utils";
import { Octicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

function describeEvent(
  event: EventItem["event"],
  colors: ColorTokens,
): { icon: React.ComponentProps<typeof Octicons>["name"]; color: string; text: string } {
  const actor = event.actor?.login ?? "someone";

  switch (event.event) {
    case "labeled":
      return {
        icon: "tag",
        color: colors.textMuted,
        text: `${actor} added the ${event.label.name} label`,
      };
    case "unlabeled":
      return {
        icon: "tag",
        color: colors.textMuted,
        text: `${actor} removed the ${event.label.name} label`,
      };
    case "closed":
      return { icon: "issue-closed", color: colors.danger, text: `${actor} closed this` };
    case "reopened":
      return { icon: "issue-reopened", color: colors.success, text: `${actor} reopened this` };
    case "merged":
      return { icon: "git-merge", color: colors.merged, text: `${actor} merged this` };
    case "head_ref_force_pushed":
    case "base_ref_force_pushed":
      return {
        icon: "repo-push",
        color: colors.textMuted,
        text: `${actor} force-pushed the branch`,
      };
    case "cross-referenced": {
      const src = event.source.issue;
      return {
        icon: "cross-reference",
        color: colors.textMuted,
        text: `${actor} linked ${src.repository.full_name}#${src.number}`,
      };
    }
  }
}

export function TimelineEventRow({
  event,
  colors,
  currentRepoFullName,
}: {
  event: EventItem["event"];
  colors: ColorTokens;
  currentRepoFullName: string;
}) {
  const s = useMemo(() => buildStyles(), []);
  const display = describeEvent(event, colors);
  const isCrossRef = event.event === "cross-referenced";

  const handlePress = () => {
    if (event.event !== "cross-referenced") return;
    const src = event.source.issue;

    if (src.repository.full_name === currentRepoFullName) {
      const [owner, repo] = src.repository.full_name.split("/");
      router.push({
        pathname: src.pull_request
          ? "/(app)/repo/[repoId]/pr/[number]"
          : "/(app)/repo/[repoId]/issue/[number]",
        params: {
          repoId: encodeRepoId(owner, repo),
          number: String(src.number),
        },
      });
    } else {
      WebBrowser.openBrowserAsync(src.html_url);
    }
  };

  return (
    <Pressable
      style={({ pressed }) => [s.row, isCrossRef && pressed && s.rowPressed]}
      onPress={isCrossRef ? handlePress : undefined}
      disabled={!isCrossRef}
    >
      <View style={[s.iconWrap, { backgroundColor: colors.surfaceSecondary }]}>
        <Octicons name={display.icon} size={12} color={display.color} />
      </View>
      <Text style={[s.text, { color: colors.textSecondary }]} numberOfLines={2}>
        {display.text}
      </Text>
      <Text style={[s.time, { color: colors.textMuted }]}>
        {relativeTime(event.created_at)}
      </Text>
    </Pressable>
  );
}

function buildStyles() {
  return StyleSheet.create({
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.sm,
      paddingVertical: Spacing.xs + 2,
    },
    rowPressed: {
      opacity: 0.6,
    },
    iconWrap: {
      width: 22,
      height: 22,
      borderRadius: Radius.full,
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
    },
    text: {
      flex: 1,
      fontFamily: FontFamily.regular,
      fontSize: FontSize.caption,
    },
    time: {
      fontFamily: FontFamily.regular,
      fontSize: 11,
      flexShrink: 0,
    },
  });
}
