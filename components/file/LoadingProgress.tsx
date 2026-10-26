import { useEffect, useMemo, useRef, useState } from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";

import {
  FontFamily,
  FontSize,
  Radius,
  Spacing,
  useTheme,
  type ColorTokens,
} from "@/constants/theme";

interface LoadingProgressProps {
  isLoading: boolean;
  fileName: string;
}

export function LoadingProgress({ isLoading, fileName }: LoadingProgressProps) {
  const { colors } = useTheme();
  const animatedProgress = useRef(new Animated.Value(0)).current;
  const [displayProgress, setDisplayProgress] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    let animation: Animated.CompositeAnimation;

    if (isLoading) {
      setVisible(true);
      animatedProgress.setValue(0);
      animation = Animated.sequence([
        Animated.timing(animatedProgress, {
          toValue: 0.4,
          duration: 800,
          easing: Easing.out(Easing.quad),
          useNativeDriver: false,
        }),
        Animated.timing(animatedProgress, {
          toValue: 0.8,
          duration: 3200,
          easing: Easing.out(Easing.quad),
          useNativeDriver: false,
        }),
        Animated.timing(animatedProgress, {
          toValue: 0.98,
          duration: 20000,
          easing: Easing.out(Easing.quad),
          useNativeDriver: false,
        }),
      ]);
      animation.start();
    } else {
      animation = Animated.timing(animatedProgress, {
        toValue: 1,
        duration: 400,
        easing: Easing.out(Easing.quad),
        useNativeDriver: false,
      });
      animation.start(({ finished }) => {
        if (finished) {
          setTimeout(() => setVisible(false), 200);
        }
      });
    }

    const listenerId = animatedProgress.addListener(({ value }) => {
      setDisplayProgress(Math.round(value * 100));
    });

    return () => {
      animation?.stop();
      animatedProgress.removeListener(listenerId);
    };
  }, [isLoading, animatedProgress]);

  const s = useMemo(() => buildStyles(colors), [colors]);

  if (!visible) return null;

  return (
    <View style={s.centered}>
      <View style={s.progressContainer}>
        <View style={s.progressTrack}>
          <Animated.View
            style={[
              s.progressFill,
              {
                width: animatedProgress.interpolate({
                  inputRange: [0, 1],
                  outputRange: ["0%", "100%"],
                }),
              },
            ]}
          />
        </View>
        <Text style={s.loadingText}>{displayProgress}%</Text>
      </View>
      <Text style={s.loadingText}>{`Loading ${fileName}...`}</Text>
    </View>
  );
}

function buildStyles(colors: ColorTokens) {
  return StyleSheet.create({
    centered: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      padding: Spacing.xl,
      gap: Spacing.md,
      minHeight: 300,
    },

    progressContainer: {
      width: "100%",
      maxWidth: 280,
      alignItems: "center",
      gap: Spacing.sm,
    },

    progressTrack: {
      width: "100%",
      height: 6,
      backgroundColor: colors.surfaceSecondary,
      borderRadius: Radius.full,
      overflow: "hidden",
    },

    progressFill: {
      height: "100%",
      backgroundColor: colors.accent,
      borderRadius: Radius.full,
    },

    loadingText: {
      fontFamily: FontFamily.medium,
      fontSize: FontSize.body,
      color: colors.textMuted,
    },
  });
}
