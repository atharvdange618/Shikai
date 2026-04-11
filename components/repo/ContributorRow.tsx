import { Image } from "expo-image";
import { StyleSheet, Text, useColorScheme, View } from "react-native";

import {
  AvatarSize,
  DarkColors,
  FontFamily,
  LightColors,
} from "@/constants/theme";
import type { GitHubContributor } from "@/types/github.types";

const MAX_SHOWN = 8;
const AVATAR_SIZE = AvatarSize.xs;
const OVERLAP = 12;

interface ContributorRowProps {
  contributors: GitHubContributor[];
  isLoading?: boolean;
}

export function ContributorRow({
  contributors,
  isLoading = false,
}: ContributorRowProps) {
  const isDark = useColorScheme() === "dark";
  const colors = isDark ? DarkColors : LightColors;
  const s = buildStyles(colors);

  if (isLoading) {
    return (
      <View style={s.row}>
        {Array.from({ length: 5 }).map((_, i) => (
          <View
            key={i}
            style={[
              s.avatar,
              s.avatarSkeleton,
              i > 0 && { marginLeft: -OVERLAP },
              { zIndex: MAX_SHOWN - i },
            ]}
          />
        ))}
      </View>
    );
  }

  if (!contributors.length) return null;

  const shown = contributors.slice(0, MAX_SHOWN);
  const overflow = contributors.length - MAX_SHOWN;

  return (
    <View style={s.row}>
      {shown.map((contributor, i) => (
        <Image
          key={contributor.id}
          source={{ uri: contributor.avatar_url }}
          style={[
            s.avatar,
            i > 0 && { marginLeft: -OVERLAP },
            { zIndex: MAX_SHOWN - i },
          ]}
          contentFit="cover"
          transition={150}
        />
      ))}

      {overflow > 0 && (
        <View
          style={[
            s.avatar,
            s.overflowBadge,
            { marginLeft: -OVERLAP, zIndex: 0 },
          ]}
        >
          <Text style={s.overflowText}>+{overflow}</Text>
        </View>
      )}
    </View>
  );
}

function buildStyles(colors: typeof LightColors | typeof DarkColors) {
  return StyleSheet.create({
    row: {
      flexDirection: "row",
      alignItems: "center",
    },

    avatar: {
      width: AVATAR_SIZE,
      height: AVATAR_SIZE,
      borderRadius: AVATAR_SIZE / 2,
      borderWidth: 1.5,
      borderColor: colors.background,
    },

    avatarSkeleton: {
      backgroundColor: colors.surfaceSecondary,
    },

    overflowBadge: {
      backgroundColor: colors.surfaceSecondary,
      borderColor: colors.background,
      alignItems: "center",
      justifyContent: "center",
    },

    overflowText: {
      fontFamily: FontFamily.medium,
      fontSize: 8,
      color: colors.textSecondary,
    },
  });
}
