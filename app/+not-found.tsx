import { Octicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useMemo } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  DarkColors,
  FontFamily,
  FontSize,
  LightColors,
  Radius,
  Spacing,
} from "@/constants/theme";

export default function NotFoundScreen() {
  const isDark = useColorScheme() === "dark";
  const colors = isDark ? DarkColors : LightColors;
  const router = useRouter();
  const s = useMemo(() => buildStyles(colors), [colors]);

  return (
    <SafeAreaView style={s.container}>
      <View style={s.content}>
        <Octicons name="question" size={48} color={colors.textMuted} />
        <Text style={s.title}>Page not found</Text>
        <Text style={s.subtitle}>
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </Text>
        <Pressable
          style={({ pressed }) => [
            s.button,
            { backgroundColor: colors.accent },
            pressed && { opacity: 0.8 },
          ]}
          onPress={() => router.replace("/(app)/(tabs)/overview" as any)}
        >
          <Text style={s.buttonText}>Go to Home</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function buildStyles(colors: typeof LightColors | typeof DarkColors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      gap: Spacing.md,
      padding: Spacing.xl,
    },
    title: {
      fontFamily: FontFamily.semiBold,
      fontSize: FontSize.heading,
      color: colors.textPrimary,
    },
    subtitle: {
      fontFamily: FontFamily.regular,
      fontSize: FontSize.body,
      color: colors.textSecondary,
      textAlign: "center",
      lineHeight: FontSize.body * 1.5,
    },
    button: {
      marginTop: Spacing.sm,
      paddingHorizontal: Spacing.xl,
      paddingVertical: Spacing.sm,
      borderRadius: Radius.md,
    },
    buttonText: {
      fontFamily: FontFamily.semiBold,
      fontSize: FontSize.body,
      color: "#FFFFFF",
    },
  });
}
