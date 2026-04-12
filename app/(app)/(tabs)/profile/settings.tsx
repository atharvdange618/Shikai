import { Octicons } from "@expo/vector-icons";
import Constants from "expo-constants";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useColorScheme,
  View,
} from "react-native";

import { validateToken } from "@/lib/github-rest";
import { deleteToken, getStoredToken, saveToken } from "@/lib/secure-storage";
import { useAuthStore } from "@/stores/auth.store";

import {
  DarkColors,
  FontFamily,
  FontSize,
  IconSize,
  Layout,
  LightColors,
  Radius,
  Shadows,
  Spacing,
} from "@/constants/theme";

const APP_VERSION = Constants.expoConfig?.version ?? "1.0.0";

export default function SettingsScreen() {
  const isDark = useColorScheme() === "dark";
  const colors = isDark ? DarkColors : LightColors;
  const shadows = isDark ? {} : Shadows.light.sm;

  const setToken = useAuthStore((s) => s.setToken);
  const setUser = useAuthStore((s) => s.setUser);
  const clearAuth = useAuthStore((s) => s.clearAuth);

  const [isEditing, setIsEditing] = useState(false);
  const [newToken, setNewToken] = useState("");
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);

  const [maskedToken, setMaskedToken] = useState<string | null>(null);

  useState(() => {
    getStoredToken().then((t) => {
      if (t) setMaskedToken(`${"•".repeat(12)}${t.slice(-4)}`);
    });
  });

  const handleUpdateToken = useCallback(async () => {
    const trimmed = newToken.trim();

    if (!trimmed) {
      setTokenError("Paste your new GitHub token here.");
      return;
    }

    if (!trimmed.startsWith("ghp_") && !trimmed.startsWith("github_pat_")) {
      setTokenError(
        "Doesn't look like a GitHub token. Should start with ghp_ or github_pat_",
      );
      return;
    }

    setIsValidating(true);
    setTokenError(null);

    try {
      const user = await validateToken(trimmed);

      await saveToken(trimmed);
      setToken(trimmed);
      setUser(user);

      setMaskedToken(`${"•".repeat(12)}${trimmed.slice(-4)}`);

      setUpdateSuccess(true);
      setNewToken("");
      setIsEditing(false);
      setTimeout(() => setUpdateSuccess(false), 3000);
    } catch {
      setTokenError(
        "Token is invalid or has been revoked. Double-check and try again.",
      );
    } finally {
      setIsValidating(false);
    }
  }, [newToken, setToken, setUser]);

  const handleCancelEdit = useCallback(() => {
    setIsEditing(false);
    setNewToken("");
    setTokenError(null);
  }, []);

  const handleSignOut = useCallback(() => {
    Alert.alert(
      "Sign Out",
      "This will remove your GitHub token from the device. You'll need to enter it again to use Shikai.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Sign Out",
          style: "destructive",
          onPress: async () => {
            await deleteToken();
            clearAuth();
          },
        },
      ],
    );
  }, [clearAuth]);

  const s = buildStyles(colors, shadows);

  return (
    <ScrollView
      style={s.scroll}
      contentContainerStyle={s.content}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <View style={s.sectionGroup}>
        <Text style={s.sectionTitle}>GitHub Token</Text>

        <View style={s.cardWrapper}>
          <View style={s.card}>
            <View style={s.tokenRow}>
              <Octicons
                name="key"
                size={IconSize.sm}
                color={colors.textMuted}
              />
              <Text style={s.maskedToken} numberOfLines={1}>
                {maskedToken ?? "••••••••••••••••"}
              </Text>
              {updateSuccess && (
                <View style={s.successBadge}>
                  <Octicons name="check" size={12} color={colors.success} />
                  <Text style={s.successText}>Updated</Text>
                </View>
              )}
            </View>

            <View style={s.divider} />

            {isEditing ? (
              <View style={s.editBlock}>
                <TextInput
                  style={[s.tokenInput, tokenError && s.tokenInputError]}
                  value={newToken}
                  onChangeText={(t) => {
                    setNewToken(t);
                    setTokenError(null);
                  }}
                  placeholder="Paste new token…"
                  placeholderTextColor={colors.textMuted}
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="off"
                  secureTextEntry
                  editable={!isValidating}
                  autoFocus
                />

                {tokenError && <Text style={s.errorText}>{tokenError}</Text>}

                <View style={s.editActions}>
                  <Pressable
                    style={({ pressed }) => [
                      s.editButton,
                      s.cancelButton,
                      pressed && { opacity: 0.7 },
                    ]}
                    onPress={handleCancelEdit}
                    disabled={isValidating}
                  >
                    <Text style={s.cancelButtonText}>Cancel</Text>
                  </Pressable>

                  <Pressable
                    style={({ pressed }) => [
                      s.editButton,
                      s.saveButton,
                      (isValidating || !newToken.trim()) &&
                        s.saveButtonDisabled,
                      pressed && { opacity: 0.85 },
                    ]}
                    onPress={handleUpdateToken}
                    disabled={isValidating || !newToken.trim()}
                  >
                    {isValidating ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text style={s.saveButtonText}>Validate & Save</Text>
                    )}
                  </Pressable>
                </View>
              </View>
            ) : (
              <Pressable
                style={({ pressed }) => [
                  s.updateButton,
                  pressed && { opacity: 0.7 },
                ]}
                onPress={() => setIsEditing(true)}
              >
                <Octicons name="pencil" size={14} color={colors.accent} />
                <Text style={s.updateButtonText}>Update Token</Text>
              </Pressable>
            )}
          </View>

          <Text style={s.hint}>
            Your token is stored securely in the device keychain. Shikai never
            sends it to any server.
          </Text>
        </View>
      </View>

      <View style={s.sectionGroup}>
        <Text style={s.sectionTitle}>Required Scopes</Text>
        <View style={s.cardWrapper}>
          <View style={s.card}>
            <ScopeRow
              scope="read:user"
              desc="Profile, followers, activity"
              colors={colors}
            />
            <View style={s.divider} />
            <ScopeRow
              scope="repo"
              desc="Repositories (incl. private)"
              colors={colors}
            />
          </View>
        </View>
      </View>

      <View style={s.sectionGroup}>
        <Text style={s.sectionTitle}>Account</Text>
        <View style={s.cardWrapper}>
          <View style={s.card}>
            <Pressable
              style={({ pressed }) => [
                s.signOutRow,
                pressed && { opacity: 0.7 },
              ]}
              onPress={handleSignOut}
            >
              <Octicons
                name="sign-out"
                size={IconSize.sm}
                color={colors.danger}
              />
              <Text style={s.signOutText}>Sign Out</Text>
            </Pressable>
          </View>
        </View>
      </View>

      <View style={s.footer}>
        <Octicons name="mark-github" size={18} color={colors.textMuted} />
        <Text style={s.footerText}>Shikai v{APP_VERSION}</Text>
        <Text style={s.footerSubtext}>
          Read-only · No data leaves your device
        </Text>
      </View>
    </ScrollView>
  );
}

function ScopeRow({
  scope,
  desc,
  colors,
}: {
  scope: string;
  desc: string;
  colors: typeof LightColors | typeof DarkColors;
}) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: Spacing.lg,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.md,
      }}
    >
      <View
        style={{
          backgroundColor: colors.accentSubtle,
          borderRadius: Radius.md,
          borderWidth: 1,
          borderColor: colors.accentMuted,
          paddingHorizontal: Spacing.sm,
          paddingVertical: Spacing.xs,
        }}
      >
        <Text
          style={{
            fontFamily: FontFamily.mono,
            fontSize: FontSize.caption,
            color: colors.accent,
          }}
        >
          {scope}
        </Text>
      </View>
      <Text
        style={{
          flex: 1,
          fontFamily: FontFamily.regular,
          fontSize: FontSize.body,
          lineHeight: FontSize.body * 1.4,
          color: colors.textSecondary,
        }}
      >
        {desc}
      </Text>
    </View>
  );
}

function buildStyles(
  colors: typeof LightColors | typeof DarkColors,
  shadows: object,
) {
  return StyleSheet.create({
    scroll: {
      flex: 1,
      backgroundColor: colors.background,
    },

    content: {
      paddingHorizontal: Layout.screenPadding,
      paddingTop: Spacing.xl,
      paddingBottom: Spacing.xxl,
      gap: Spacing.xl,
    },

    sectionGroup: {
      gap: Spacing.md,
    },

    sectionTitle: {
      fontFamily: FontFamily.medium,
      fontSize: FontSize.label,
      color: colors.textMuted,
      textTransform: "uppercase",
      letterSpacing: 0.6,
      paddingHorizontal: Spacing.xs,
    },

    cardWrapper: {
      gap: Spacing.sm,
    },

    card: {
      backgroundColor: colors.surface,
      borderRadius: Radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: "hidden",
      ...shadows,
    },

    divider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: colors.border,
    },

    tokenRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.md,
      padding: Spacing.md,
    },

    maskedToken: {
      flex: 1,
      fontFamily: FontFamily.mono,
      fontSize: FontSize.label,
      color: colors.textSecondary,
      letterSpacing: 1,
    },

    successBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },

    successText: {
      fontFamily: FontFamily.medium,
      fontSize: FontSize.caption,
      color: colors.success,
    },

    editBlock: {
      padding: Spacing.md,
      gap: Spacing.sm,
    },

    tokenInput: {
      backgroundColor: colors.surfaceSecondary,
      borderRadius: Radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      fontFamily: FontFamily.mono,
      fontSize: FontSize.label,
      color: colors.textPrimary,
      height: 48,
    },

    tokenInputError: {
      borderColor: colors.danger,
    },

    errorText: {
      fontFamily: FontFamily.regular,
      fontSize: FontSize.caption,
      color: colors.danger,
      lineHeight: FontSize.caption * 1.5,
    },

    editActions: {
      flexDirection: "row",
      gap: Spacing.sm,
      marginTop: Spacing.xs,
    },

    editButton: {
      flex: 1,
      height: 44,
      borderRadius: Radius.md,
      alignItems: "center",
      justifyContent: "center",
    },

    cancelButton: {
      backgroundColor: colors.surfaceSecondary,
      borderWidth: 1,
      borderColor: colors.border,
    },

    cancelButtonText: {
      fontFamily: FontFamily.medium,
      fontSize: FontSize.body,
      color: colors.textSecondary,
    },

    saveButton: {
      backgroundColor: colors.accent,
    },

    saveButtonDisabled: {
      opacity: 0.5,
    },

    saveButtonText: {
      fontFamily: FontFamily.semiBold,
      fontSize: FontSize.body,
      color: "#FFFFFF",
    },

    updateButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.sm,
      padding: Spacing.md,
    },

    updateButtonText: {
      fontFamily: FontFamily.medium,
      fontSize: FontSize.body,
      color: colors.accent,
    },

    signOutRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.md,
      padding: Spacing.md,
    },

    signOutText: {
      fontFamily: FontFamily.medium,
      fontSize: FontSize.body,
      color: colors.danger,
    },

    hint: {
      fontFamily: FontFamily.regular,
      fontSize: FontSize.caption,
      color: colors.textMuted,
      lineHeight: FontSize.caption * 1.6,
      paddingHorizontal: Spacing.xs,
    },

    footer: {
      alignItems: "center",
      gap: Spacing.sm,
      paddingTop: Spacing.xl,
      marginTop: Spacing.md,
    },

    footerText: {
      fontFamily: FontFamily.medium,
      fontSize: FontSize.label,
      color: colors.textMuted,
    },

    footerSubtext: {
      fontFamily: FontFamily.regular,
      fontSize: FontSize.caption,
      color: colors.textMuted,
    },
  });
}
