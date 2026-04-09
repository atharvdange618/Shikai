import { Octicons } from "@expo/vector-icons";
import { useEffect } from "react";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

export type TabIconName =
  | "home"
  | "home-fill"
  | "repo"
  | "star"
  | "star-fill"
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
  const scale = useSharedValue(focused ? 1.1 : 1.0);

  useEffect(() => {
    scale.value = withSpring(focused ? 1.1 : 1.0, {
      damping: 15,
      stiffness: 300,
      mass: 0.8,
    });
  }, [focused, scale]);

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
