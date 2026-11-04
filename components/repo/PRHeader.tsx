import { FontFamily, FontSize, useTheme } from "@/constants/theme";
import { decodeRepoId } from "@/lib/utils";
import { Stack } from "expo-router";
import { Text, View } from "react-native";

export function PRHeader({
  title,
  repoId,
  number,
}: {
  title: string;
  repoId: string;
  number: string;
}) {
  const { colors } = useTheme();
  const [owner, repo] = decodeRepoId(repoId);
  return (
    <Stack.Screen
      options={{
        headerTitle: () => (
          <View style={{ flexShrink: 1 }}>
            <Text
              style={{
                color: colors.textPrimary,
                fontFamily: FontFamily.semiBold,
                fontSize: FontSize.body,
              }}
              numberOfLines={1}
            >
              {title}
            </Text>
            <Text
              style={{
                color: colors.textSecondary,
                fontFamily: FontFamily.regular,
                fontSize: FontSize.caption,
              }}
              numberOfLines={2}
            >
              {owner} / {repo} · PR #{number}
            </Text>
          </View>
        ),
      }}
    />
  );
}
