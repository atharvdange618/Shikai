import { Octicons } from "@expo/vector-icons";
import { useNavigation } from "expo-router/react-navigation";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  type ViewInstance,
  type ViewStyle,
} from "react-native";

import {
  FontFamily,
  FontSize,
  Radius,
  Shadows,
  Spacing,
  useTheme,
  ZIndex,
} from "@/constants/theme";

interface TooltipContextValue {
  activeId: string | null;
  register: (id: string) => void;
  unregister: (id: string) => void;
}

const TooltipContext = createContext<TooltipContextValue | null>(null);

export function TooltipProvider({ children }: { children: React.ReactNode }) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const navigation = useNavigation();

  const register = useCallback((id: string) => {
    setActiveId(id);
  }, []);

  const unregister = useCallback((id: string) => {
    setActiveId((current) => (current === id ? null : current));
  }, []);

  const dismiss = useCallback(() => {
    setActiveId(null);
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener("state", () => {
      setActiveId(null);
    });
    return unsubscribe;
  }, [navigation]);

  return (
    <TooltipContext.Provider value={{ activeId, register, unregister }}>
      {children}
      {activeId && <Pressable style={s.overlay} onPress={dismiss} />}
    </TooltipContext.Provider>
  );
}

interface TooltipProps {
  content: string;
  children: React.ReactNode;
  align?: "left" | "center" | "right";
}

export function Tooltip({ content, children, align = "left" }: TooltipProps) {
  const { colors, isDark } = useTheme();
  const shadows = isDark ? {} : Shadows.light.md;
  const id = useId();
  const ctx = useContext(TooltipContext);
  const visible = ctx ? ctx.activeId === id : false;
  const { width: screenWidth } = useWindowDimensions();

  const containerRef = useRef<ViewInstance>(null);
  const [layoutInfo, setLayoutInfo] = useState<{
    pageX: number;
    width: number;
  } | null>(null);

  useEffect(() => {
    if (visible) {
      containerRef.current?.measureInWindow((x, _y, width) => {
        if (typeof x === "number" && !isNaN(x)) {
          setLayoutInfo({ pageX: x, width });
        }
      });
    }
  }, [visible]);

  const toggle = useCallback(() => {
    if (!ctx) return;
    if (visible) {
      ctx.unregister(id);
    } else {
      ctx.register(id);
    }
  }, [ctx, visible, id]);

  const tooltipWidth = 250;
  const padding = 16;
  let alignStyle: ViewStyle;

  if (layoutInfo) {
    const { pageX, width: containerWidth } = layoutInfo;
    const defaultRelativeLeft =
      align === "left"
        ? 0
        : align === "right"
          ? containerWidth - tooltipWidth
          : containerWidth / 2 - tooltipWidth / 2;

    const defaultScreenLeft = pageX + defaultRelativeLeft;
    const targetScreenLeft = Math.max(
      padding,
      Math.min(defaultScreenLeft, screenWidth - padding - tooltipWidth),
    );
    const relativeLeft = targetScreenLeft - pageX;

    alignStyle = { left: relativeLeft };
  } else {
    alignStyle =
      align === "left"
        ? { left: 0 }
        : align === "right"
          ? { right: 0 }
          : { left: "50%", transform: [{ translateX: -125 }] };
  }

  return (
    <View ref={containerRef} style={s.container}>
      <Pressable onPress={toggle} hitSlop={19}>
        {children}
      </Pressable>
      {visible && (
        <View
          style={[
            s.tooltip,
            alignStyle,
            shadows,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <Text style={[s.text, { color: colors.textSecondary }]}>
            {content}
          </Text>
        </View>
      )}
    </View>
  );
}

interface InfoDotProps {
  label: string;
  description: string;
  color?: "warning" | "danger" | "accent";
  align?: "left" | "center" | "right";
}

export function InfoDot({
  label,
  description,
  color = "accent",
  align = "left",
}: InfoDotProps) {
  const { colors, isDark } = useTheme();
  const shadows = isDark ? {} : Shadows.light.md;
  const id = useId();
  const ctx = useContext(TooltipContext);
  const visible = ctx ? ctx.activeId === id : false;
  const { width: screenWidth } = useWindowDimensions();

  const containerRef = useRef<ViewInstance>(null);
  const [layoutInfo, setLayoutInfo] = useState<{
    pageX: number;
    width: number;
  } | null>(null);

  const onLayout = () => {
    containerRef.current?.measureInWindow((x, _y, width) => {
      if (typeof x === "number" && !isNaN(x)) {
        setLayoutInfo({ pageX: x, width });
      }
    });
  };

  useEffect(() => {
    if (visible) {
      containerRef.current?.measureInWindow((x, _y, width) => {
        if (typeof x === "number" && !isNaN(x)) {
          setLayoutInfo({ pageX: x, width });
        }
      });
    }
  }, [visible]);

  const dotColor =
    color === "danger"
      ? colors.danger
      : color === "warning"
        ? colors.warning
        : colors.accent;

  const bgColor =
    color === "danger"
      ? colors.dangerSubtle
      : color === "warning"
        ? colors.warningSubtle
        : colors.accentSubtle;

  const tooltipWidth = 250;
  const padding = 16;
  let alignStyle: ViewStyle;

  if (layoutInfo) {
    const { pageX, width: containerWidth } = layoutInfo;
    const defaultRelativeLeft =
      align === "left"
        ? 0
        : align === "right"
          ? containerWidth - tooltipWidth
          : containerWidth / 2 - tooltipWidth / 2;

    const defaultScreenLeft = pageX + defaultRelativeLeft;
    const targetScreenLeft = Math.max(
      padding,
      Math.min(defaultScreenLeft, screenWidth - padding - tooltipWidth),
    );
    const relativeLeft = targetScreenLeft - pageX;

    alignStyle = { left: relativeLeft };
  } else {
    alignStyle =
      align === "left"
        ? { left: 0 }
        : align === "right"
          ? { right: 0 }
          : { left: "50%", transform: [{ translateX: -125 }] };
  }

  return (
    <View ref={containerRef} onLayout={onLayout} style={s.infoDotWrap}>
      <Pressable
        style={[s.infoDot, { backgroundColor: bgColor, borderColor: dotColor }]}
        onPress={() => {
          if (!ctx) return;
          if (visible) {
            ctx.unregister(id);
          } else {
            ctx.register(id);
          }
        }}
      >
        <Text style={[s.infoDotLabel, { color: dotColor }]}>{label}</Text>
        <Octicons
          name="info"
          size={10}
          color={dotColor}
          style={{ opacity: 0.6 }}
        />
      </Pressable>
      {visible && (
        <View
          style={[
            s.tooltip,
            alignStyle,
            shadows,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <Text style={[s.text, { color: colors.textSecondary }]}>
            {description}
          </Text>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    zIndex: ZIndex.tooltip - 1,
  },
  container: {
    position: "relative",
  },
  tooltip: {
    position: "absolute",
    top: "100%",
    width: 250,
    marginTop: 4,
    padding: Spacing.sm,
    borderRadius: Radius.sm,
    borderWidth: 1,
    zIndex: ZIndex.tooltip,
    elevation: ZIndex.tooltip,
  },
  text: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.caption,
    lineHeight: FontSize.caption * 1.5,
  },
  infoDotWrap: {
    position: "relative",
    alignItems: "flex-start",
  },
  infoDot: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.sm,
    borderWidth: 1,
  },
  infoDotLabel: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.caption,
  },
});
