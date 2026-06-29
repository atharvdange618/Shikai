import { Octicons } from "@expo/vector-icons";
import React, {
  createContext,
  useCallback,
  useContext,
  useState,
} from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";
import Animated, {
  FadeIn,
  FadeOut,
  SlideInDown,
  SlideOutDown,
} from "react-native-reanimated";

import {
  DarkColors,
  FontFamily,
  FontSize,
  LightColors,
  Radius,
  Spacing,
  ZIndex,
} from "@/constants/theme";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type AlertVariant = "info" | "success" | "warning" | "danger";

interface AlertAction {
  text: string;
  style?: "default" | "cancel" | "destructive";
  onPress?: () => void;
}

interface AlertConfig {
  variant?: AlertVariant;
  title: string;
  message?: string;
  actions?: AlertAction[];
}

interface AlertContextValue {
  show: (config: AlertConfig) => void;
  hide: () => void;
}

const AlertContext = createContext<AlertContextValue | null>(null);

export function AlertProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<AlertConfig | null>(null);

  const show = useCallback((cfg: AlertConfig) => {
    setConfig(cfg);
  }, []);

  const hide = useCallback(() => {
    setConfig(null);
  }, []);

  return (
    <AlertContext.Provider value={{ show, hide }}>
      {children}
      {config && <AlertDialog config={config} onClose={hide} />}
    </AlertContext.Provider>
  );
}

export function useAlert() {
  const ctx = useContext(AlertContext);
  if (!ctx) {
    throw new Error("useAlert must be used within AlertProvider");
  }
  return ctx;
}

function AlertDialog({
  config,
  onClose,
}: {
  config: AlertConfig;
  onClose: () => void;
}) {
  const isDark = useColorScheme() === "dark";
  const colors = isDark ? DarkColors : LightColors;
  const insets = useSafeAreaInsets();

  const variant = config.variant ?? "info";
  const actions = config.actions ?? [{ text: "OK", style: "default" }];

  const variantColor = {
    info: colors.accent,
    success: colors.success,
    warning: colors.warning,
    danger: colors.danger,
  }[variant];

  const variantIcon = {
    info: "info" as const,
    success: "check-circle" as const,
    warning: "alert" as const,
    danger: "alert" as const,
  }[variant];

  const handleAction = (action: AlertAction) => {
    onClose();
    action.onPress?.();
  };

  return (
    <Modal
      visible
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <Animated.View
        entering={FadeIn.duration(200)}
        exiting={FadeOut.duration(150)}
        style={[styles.backdrop, { backgroundColor: "rgba(0,0,0,0.4)" }]}
      >
        <Pressable style={styles.backdropPress} onPress={onClose} />
        <Animated.View
          entering={SlideInDown.duration(250).damping(18)}
          exiting={SlideOutDown.duration(150)}
          style={[
            styles.dialog,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              marginBottom: insets.bottom + Spacing.xl,
            },
          ]}
        >
          <View style={styles.iconRow}>
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: `${variantColor}18` },
              ]}
            >
              <Octicons name={variantIcon} size={22} color={variantColor} />
            </View>
          </View>

          <Text style={[styles.title, { color: colors.textPrimary }]}>
            {config.title}
          </Text>

          {config.message && (
            <Text style={[styles.message, { color: colors.textSecondary }]}>
              {config.message}
            </Text>
          )}

          <View style={styles.actions}>
            {actions.map((action, i) => {
              const isDestructive = action.style === "destructive";
              const isCancel = action.style === "cancel";
              const isLast = i === actions.length - 1;

              return (
                <Pressable
                  key={i}
                  style={({ pressed }) => [
                    styles.actionButton,
                    isDestructive && {
                      backgroundColor: `${colors.danger}12`,
                      borderColor: colors.danger,
                    },
                    isCancel && {
                      backgroundColor: colors.surfaceSecondary,
                      borderColor: colors.border,
                    },
                    !isDestructive &&
                      !isCancel && {
                        backgroundColor: colors.accent,
                        borderColor: colors.accent,
                      },
                    !isLast && { marginRight: Spacing.sm },
                    pressed && { opacity: 0.7 },
                  ]}
                  onPress={() => handleAction(action)}
                >
                  <Text
                    style={[
                      styles.actionText,
                      {
                        color: isDestructive
                          ? colors.danger
                          : isCancel
                            ? colors.textSecondary
                            : colors.textOnAccent,
                      },
                    ]}
                  >
                    {action.text}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    zIndex: ZIndex.modal,
    elevation: ZIndex.modal,
  },
  backdropPress: {
    ...StyleSheet.absoluteFillObject,
  },
  dialog: {
    width: "80%",
    maxWidth: 320,
    borderRadius: Radius.xl,
    borderWidth: 1,
    padding: Spacing.xl,
    zIndex: ZIndex.modal + 1,
    elevation: ZIndex.modal + 1,
  },
  iconRow: {
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.title,
    textAlign: "center",
    marginBottom: Spacing.xs,
  },
  message: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.body,
    textAlign: "center",
    lineHeight: FontSize.body * 1.5,
    marginBottom: Spacing.xl,
  },
  actions: {
    flexDirection: "row",
  },
  actionButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    alignItems: "center",
  },
  actionText: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.body,
  },
});
