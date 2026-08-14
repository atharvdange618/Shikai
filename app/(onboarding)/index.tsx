import { Octicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback, useMemo, useRef, useState } from "react";
import {
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, {
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  FontFamily,
  FontSize,
  Radius,
  Spacing,
  useTheme,
  type ColorTokens,
} from "@/constants/theme";
import { mmkv } from "@/lib/mmkv";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const ONBOARDING_KEY = "onboarding_completed";

const SLIDES = [
  {
    icon: "mark-github" as const,
    title: "Your GitHub, at a glance",
    description:
      "A read-only companion for tracking repos, contributions, and activity.",
  },
  {
    icon: "project" as const,
    title: "Overview dashboard",
    description:
      "Pinned repos, recent activity, and your following feed all in one place.",
  },
  {
    icon: "graph" as const,
    title: "Contribution graph",
    description:
      "Track your streak, most active day, and yearly progress.",
  },
  {
    icon: "check-circle" as const,
    title: "You're all set",
    description: "Sign in with GitHub to get started.",
  },
] as const;

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

let _onCompleteCallback: (() => void) | null = null;

export function setOnboardingCompleteListener(cb: () => void) {
  _onCompleteCallback = cb;
}

export function markOnboardingComplete() {
  mmkv.set(ONBOARDING_KEY, true);
  _onCompleteCallback?.();
}

export function hasCompletedOnboarding(): boolean {
  return mmkv.getBoolean(ONBOARDING_KEY) === true;
}

export default function OnboardingScreen() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);
  const [currentSlide, setCurrentSlide] = useState(0);

  const s = useMemo(
    () => buildStyles(colors, insets.top, insets.bottom),
    [colors, insets.top, insets.bottom],
  );

  const handleScroll = useCallback(
    (event: { nativeEvent: { contentOffset: { x: number } } }) => {
      const index = Math.round(
        event.nativeEvent.contentOffset.x / SCREEN_WIDTH,
      );
      setCurrentSlide(index);
    },
    [],
  );

  const goToSlide = useCallback(
    (index: number) => {
      scrollRef.current?.scrollTo({ x: index * SCREEN_WIDTH, animated: true });
    },
    [],
  );

  const handleSkip = useCallback(() => {
    goToSlide(SLIDES.length - 1);
  }, [goToSlide]);

  const handleNext = useCallback(() => {
    goToSlide(currentSlide + 1);
  }, [currentSlide, goToSlide]);

  const handleComplete = useCallback(() => {
    markOnboardingComplete();
    router.replace("/sign-in");
  }, [router]);

  const isLastSlide = currentSlide === SLIDES.length - 1;

  return (
    <View style={s.container}>
      <View style={s.skipRow}>
        {!isLastSlide && (
          <Pressable onPress={handleSkip} hitSlop={8} style={s.skipButton}>
            <Text style={s.skipText}>Skip</Text>
          </Pressable>
        )}
      </View>

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        contentContainerStyle={s.scrollContent}
      >
        {SLIDES.map((slide, index) => (
          <SlideItem
            key={slide.icon}
            icon={slide.icon}
            title={slide.title}
            description={slide.description}
            isDark={isDark}
            colors={colors}
            isActive={currentSlide === index}
          />
        ))}
      </ScrollView>

      <View style={s.bottomRow}>
        <View style={s.dots}>
          {SLIDES.map((_, index) => (
            <View
              key={index}
              style={[
                s.dot,
                currentSlide === index && s.dotActive,
              ]}
            />
          ))}
        </View>

        {isLastSlide ? (
          <NextButton
            label="Get started"
            onPress={handleComplete}
            colors={colors}
          />
        ) : (
          <NextButton
            label="Next"
            onPress={handleNext}
            colors={colors}
          />
        )}
      </View>
    </View>
  );
}

function SlideItem({
  icon,
  title,
  description,
  isDark,
  colors,
  isActive,
}: {
  icon: React.ComponentProps<typeof Octicons>["name"];
  title: string;
  description: string;
  isDark: boolean;
  colors: ColorTokens;
  isActive: boolean;
}) {
  return (
    <View style={styles.slide}>
      <Animated.View
        entering={isActive ? FadeIn.duration(300) : undefined}
        style={styles.slideContent}
      >
        <View
          style={[
            styles.iconBox,
            {
              backgroundColor: colors.accentSubtle,
              borderColor: isDark ? colors.accentMuted : colors.border,
            },
          ]}
        >
          <Octicons name={icon} size={40} color={colors.accent} />
        </View>
        <Text style={[styles.slideTitle, { color: colors.textPrimary }]}>
          {title}
        </Text>
        <Text style={[styles.slideDesc, { color: colors.textSecondary }]}>
          {description}
        </Text>
      </Animated.View>
    </View>
  );
}

function NextButton({
  label,
  onPress,
  colors,
}: {
  label: string;
  onPress: () => void;
  colors: ColorTokens;
}) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      style={[styles.nextButton, { backgroundColor: colors.accent }, animatedStyle]}
      onPress={onPress}
      onPressIn={() => {
        scale.value = withSpring(0.97, { damping: 15, stiffness: 400 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 15, stiffness: 400 });
      }}
    >
      <Text style={styles.nextButtonText}>{label}</Text>
    </AnimatedPressable>
  );
}

function buildStyles(
  colors: ColorTokens,
  topInset: number,
  bottomInset: number,
) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },

    skipRow: {
      alignItems: "flex-end",
      paddingTop: Math.max(topInset, Spacing.lg),
      paddingHorizontal: Spacing.lg,
      height: 60,
    },

    skipButton: {
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
    },

    skipText: {
      fontFamily: FontFamily.medium,
      fontSize: FontSize.body,
      color: colors.textMuted,
    },

    scrollContent: {
      flexGrow: 1,
    },

    bottomRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: Spacing.lg,
      paddingBottom: Math.max(bottomInset, Spacing.xl),
      paddingTop: Spacing.md,
    },

    dots: {
      flexDirection: "row",
      gap: Spacing.sm,
    },

    dot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.border,
    },

    dotActive: {
      backgroundColor: colors.accent,
      width: 24,
    },
  });
}

const styles = StyleSheet.create({
  slide: {
    width: SCREEN_WIDTH,
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
  },

  slideContent: {
    alignItems: "center",
    gap: Spacing.lg,
    maxWidth: 320,
  },

  iconBox: {
    width: 88,
    height: 88,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },

  slideTitle: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.heading,
    textAlign: "center",
  },

  slideDesc: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.body,
    textAlign: "center",
    lineHeight: FontSize.body * 1.5,
  },

  nextButton: {
    borderRadius: Radius.md,
    height: 50,
    paddingHorizontal: 32,
    alignItems: "center",
    justifyContent: "center",
  },

  nextButtonText: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.body,
    color: "#FFFFFF",
  },
});
