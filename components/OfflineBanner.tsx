import { TextStyles, useTheme } from "@/constants/theme";
import NetInfo from "@react-native-community/netinfo";
import { useEffect, useState } from "react";
import { StyleSheet, Text } from "react-native";
import Animated, {
  FadeIn,
  FadeOut,
  LinearTransition,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export function OfflineBanner() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    return NetInfo.addEventListener((state) => {
      const offline =
        state.isConnected === false || state.isInternetReachable === false;
      setIsOffline(offline);
    });
  }, []);

  if (!isOffline) return null;

  return (
    <Animated.View
      entering={FadeIn.duration(200)}
      exiting={FadeOut.duration(200)}
      layout={LinearTransition.duration(200)}
      style={[
        styles.banner,
        { backgroundColor: colors.warningSubtle, paddingTop: insets.top },
      ]}
    >
      <Text style={[TextStyles.caption, { color: colors.textSecondary }]}>
        You{"'"}re offline - showing cached data
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 6,
    paddingHorizontal: 16,
  },
});
