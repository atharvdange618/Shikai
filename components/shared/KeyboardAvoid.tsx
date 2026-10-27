import { KeyboardAvoidingView, StyleSheet } from "react-native";

export function KeyboardAvoid({ children }: { children: React.ReactNode }) {
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior="height"
      keyboardVerticalOffset={20}
    >
      {children}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
