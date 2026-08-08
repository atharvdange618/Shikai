import { Octicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useEffect } from "react";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

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
  color: string;
  size: number;
  focused: boolean;
}

export function TabBarIcon({
  name,
  filledName,
  color,
  size,
  focused,
}: TabBarIconProps) {
  const reducedMotion = useReducedMotion();
  const scale = useSharedValue(focused ? 1.1 : 1.0);

  useEffect(() => {
    if (focused) {
      Haptics.selectionAsync();
    }
    scale.value = reducedMotion
      ? focused ? 1.1 : 1.0
      : withSpring(focused ? 1.1 : 1.0, {
          damping: 15,
          stiffness: 300,
          mass: 0.8,
        });
  }, [focused, scale, reducedMotion]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const iconName = focused && filledName ? filledName : name;

  return (
    <Animated.View style={animatedStyle}>
      <Octicons name={iconName} size={size} color={color} />
    </Animated.View>
  );
}
