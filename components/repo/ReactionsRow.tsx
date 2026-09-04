import {
  type ColorTokens,
  FontFamily,
  FontSize,
  Radius,
  Spacing,
} from "@/constants/theme";
import type { GitHubReactions } from "@/types/github.types";
import { StyleSheet, Text, View } from "react-native";

const REACTION_EMOJI: Record<Exclude<keyof GitHubReactions, "total_count">, string> = {
  "+1": "👍",
  "-1": "👎",
  laugh: "😄",
  hooray: "🎉",
  confused: "😕",
  heart: "❤️",
  rocket: "🚀",
  eyes: "👀",
};

const REACTION_KEYS = Object.keys(REACTION_EMOJI) as (keyof typeof REACTION_EMOJI)[];

export function ReactionsRow({
  reactions,
  colors,
}: {
  reactions: GitHubReactions | undefined;
  colors: ColorTokens;
}) {
  if (!reactions) return null;

  const entries = REACTION_KEYS.map((key) => ({
    key,
    emoji: REACTION_EMOJI[key],
    count: reactions[key],
  })).filter((entry) => entry.count > 0);

  if (entries.length === 0) return null;

  return (
    <View style={s.row}>
      {entries.map((entry) => (
        <View
          key={entry.key}
          style={[s.pill, { backgroundColor: colors.surfaceSecondary }]}
        >
          <Text style={s.emoji}>{entry.emoji}</Text>
          <Text style={[s.count, { color: colors.textSecondary }]}>
            {entry.count}
          </Text>
        </View>
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.xs,
    marginTop: Spacing.xs,
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
  },
  emoji: {
    fontSize: FontSize.caption,
  },
  count: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.caption,
  },
});
