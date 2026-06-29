import { Octicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Component, type ReactNode } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";

import {
  DarkColors,
  FontFamily,
  FontSize,
  LightColors,
  Radius,
  Spacing,
} from "@/constants/theme";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error} onRetry={() => this.setState({ hasError: false, error: null })} />;
    }
    return this.props.children;
  }
}

function ErrorFallback({ error, onRetry }: { error: Error | null; onRetry: () => void }) {
  const isDark = useColorScheme() === "dark";
  const colors = isDark ? DarkColors : LightColors;
  const router = useRouter();

  return (
    <View style={[s.container, { backgroundColor: colors.background }]}>
      <Octicons name="alert" size={40} color={colors.danger} />
      <Text style={[s.title, { color: colors.textPrimary }]}>
        Something went wrong
      </Text>
      <Text style={[s.message, { color: colors.textSecondary }]}>
        {error?.message || "An unexpected error occurred."}
      </Text>
      <Pressable
        style={[s.button, { backgroundColor: colors.accent }]}
        onPress={() => {
          onRetry();
          router.replace("/(app)/(tabs)/overview" as any);
        }}
      >
        <Text style={[s.buttonText, { color: "#FFFFFF" }]}>Go to Home</Text>
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.md,
    padding: Spacing.xl,
  },
  title: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.title,
  },
  message: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.body,
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
  },
});
