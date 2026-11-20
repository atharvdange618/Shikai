import { RefreshControl, type RefreshControlProps } from "react-native";

import { useTheme } from "@/constants/theme";

export function PullToRefresh({ refreshing, onRefresh, ...rest }: RefreshControlProps) {
  const { colors } = useTheme();

  return (
    <RefreshControl
      {...rest}
      refreshing={refreshing}
      onRefresh={onRefresh}
      tintColor={colors.accent}
      colors={[colors.accent]}
      progressBackgroundColor={colors.surface}
    />
  );
}
