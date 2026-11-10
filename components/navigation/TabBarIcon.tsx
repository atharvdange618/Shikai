import { Octicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useEffect } from "react";
import type { ColorValue } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";

import { useReducedMotion } from "@/hooks/useReducedMotion";

export type TabIconName =
  | "home"
  | "home-fill"
  | "repo"
  | "search"
  | "star"
  | "star-fill"
  | "bookmark"
  | "bookmark-filled"
  | "bell"
  | "bell-fill"
  | "person"
  | "person-fill";

interface TabBarIconProps {
  name: TabIconName;
  filledName?: TabIconName;
  color: ColorValue;
  size: number;
  focused: boolean;
}

export function TabBarIcon({ name, filledName, color, size, focused }: TabBarIconProps) {
  const reducedMotion = useReducedMotion();
  const scale = useSharedValue(focused ? 1.1 : 1.0);

  useEffect(() => {
    if (focused) {
      Haptics.selectionAsync().catch(() => {});
    }
    const target = focused ? 1.1 : 1.0;
    scale.set(
      reducedMotion ? target : withSpring(target, { damping: 15, stiffness: 300, mass: 0.8 }),
    );
  }, [focused, scale, reducedMotion]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const iconName = focused && filledName ? filledName : name;

  return (
    <Animated.View style={animatedStyle}>
      {/* RN 0.88 types ColorValue as an opaque internal type; icons still take a string. */}
      <Octicons name={iconName} size={size} color={color as string} />
    </Animated.View>
  );
}
