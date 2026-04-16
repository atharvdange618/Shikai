import { useEffect } from "react";
import { Image, StyleSheet, useColorScheme } from "react-native";
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";

interface AnimatedSplashScreenProps {
  onComplete?: () => void;
  isReady: boolean;
}

export function AnimatedSplashScreen({
  onComplete,
  isReady,
}: AnimatedSplashScreenProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const logoOpacity = useSharedValue(0);
  const logoScale = useSharedValue(0.3);
  const containerOpacity = useSharedValue(1);

  useEffect(() => {
    logoOpacity.value = withTiming(1, {
      duration: 800,
      easing: Easing.out(Easing.cubic),
    });

    logoScale.value = withSequence(
      withTiming(1.05, {
        duration: 800,
        easing: Easing.out(Easing.cubic),
      }),
      withRepeat(
        withSequence(
          withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
          withTiming(1.05, {
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
          }),
        ),
        -1,
        true,
      ),
    );
  }, [logoOpacity, logoScale]);

  useEffect(() => {
    if (isReady) {
      const timer = setTimeout(() => {
        containerOpacity.value = withTiming(
          0,
          {
            duration: 400,
            easing: Easing.in(Easing.cubic),
          },
          () => {
            if (onComplete) {
              runOnJS(onComplete)();
            }
          },
        );
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [containerOpacity, isReady, onComplete]);

  const logoAnimatedStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));

  const containerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: containerOpacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.container,
        { backgroundColor: isDark ? "#0D1117" : "#FAF9F6" },
        containerAnimatedStyle,
      ]}
    >
      <Animated.View style={[styles.logoContainer, logoAnimatedStyle]}>
        <Image
          source={require("@/assets/images/splash-icon.png")}
          style={styles.logo}
          resizeMode="contain"
        />
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  logoContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  logo: {
    width: 200,
    height: 200,
  },
});
