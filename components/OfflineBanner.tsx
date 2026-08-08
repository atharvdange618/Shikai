import { Octicons } from "@expo/vector-icons";
import { TextStyles, useTheme } from "@/constants/theme";
import NetInfo from "@react-native-community/netinfo";
import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
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
        { backgroundColor: colors.accent, paddingTop: insets.top + 6 },
      ]}
    >
      <View style={styles.content}>
        <Octicons name="cloud-offline" size={14} color={colors.textOnAccent} />
        <Text style={[TextStyles.caption, { color: colors.textOnAccent }]}>
          {"You're offline - showing cached data"}
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
});
