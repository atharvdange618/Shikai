import { RefreshControl, type RefreshControlProps } from "react-native";

import { useTheme } from "@/constants/theme";

/**
 * The app's only pull-to-refresh spinner.
 *
 * Why a wrapper: RN takes RefreshControl's arc colour from `colors` and the
 * tray behind it from `progressBackgroundColor`. Leave the tray unset and
 * Android paints it from the *platform* theme, so a phone in light mode shows a
 * white circle in the middle of a dark app. Reading both from tokens keeps the
 * spinner on the selected theme instead.
 *
 * Android's ScrollView clones whatever element sits in `refreshControl` and
 * injects `style` and `children`, so `...rest` has to reach the real
 * RefreshControl. The token props stay after the spread so a caller can never
 * put an off-theme colour back.
 */
export function PullToRefresh({
  refreshing,
  onRefresh,
  ...rest
}: RefreshControlProps) {
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
