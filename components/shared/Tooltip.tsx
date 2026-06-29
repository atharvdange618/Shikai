import { Octicons } from "@expo/vector-icons";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
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

let nextId = 0;

export function TooltipProvider({ children }: { children: React.ReactNode }) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const register = useCallback((id: string) => {
    setActiveId(id);
  }, []);

  const unregister = useCallback((id: string) => {
    setActiveId((current) => (current === id ? null : current));
  }, []);

  return (
    <TooltipContext.Provider value={{ activeId, register, unregister }}>
      {children}
    </TooltipContext.Provider>
  );
}

interface TooltipProps {
  content: string;
  children: React.ReactElement<any>;
  align?: "left" | "center" | "right";
}

export function Tooltip({ content, children, align = "left" }: TooltipProps) {
  const { colors, isDark } = useTheme();
  const shadows = isDark ? Shadows.dark.md : Shadows.light.md;
  const idRef = useRef(`tooltip-${++nextId}`);
  const ctx = useContext(TooltipContext);
  const visible = ctx ? ctx.activeId === idRef.current : false;
  const { width: screenWidth } = useWindowDimensions();

  const containerRef = useRef<View>(null);
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
      ctx.unregister(idRef.current);
    } else {
      ctx.register(idRef.current);
    }
  }, [ctx, visible]);

  const tooltipWidth = 250;
  const padding = 16;
  let alignStyle: any;

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
      {React.cloneElement(children, {
        onPress: toggle,
      })}
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
  const shadows = isDark ? Shadows.dark.md : Shadows.light.md;
  const idRef = useRef(`infodot-${++nextId}`);
  const ctx = useContext(TooltipContext);
  const visible = ctx ? ctx.activeId === idRef.current : false;
  const { width: screenWidth } = useWindowDimensions();

  const containerRef = useRef<View>(null);
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
  let alignStyle: any;

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
            ctx.unregister(idRef.current);
          } else {
            ctx.register(idRef.current);
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
