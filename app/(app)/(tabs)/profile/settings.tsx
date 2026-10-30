import { Octicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as Linking from "expo-linking";
import { Href, useFocusEffect, useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";

import { useAlert } from "@/components/shared/Alert";
import { KeyboardAvoid } from "@/components/shared/KeyboardAvoid";
import { useUser } from "@/hooks/useUser";
import { rateLimit } from "@/lib/axios";
import {
  areAlertsEnabled,
  disableAlerts,
  enableAlerts,
  postTestAlert,
  wasPatRejected,
} from "@/lib/background-notifications";
import { MANAGE_REPO_ACCESS_URL, validatePAT } from "@/lib/github-rest";
import { clearAllMMKV } from "@/lib/mmkv";
import { getLastPoll, type LastPoll } from "@/lib/notification-poller";
import { deletePAT, savePAT } from "@/lib/secure-storage";
import { signOut } from "@/lib/session";
import { format24HourTime, relativeTime } from "@/lib/utils";

import {
  AvatarSize,
  FontFamily,
  FontSize,
  IconSize,
  Radius,
  Spacing,
} from "@/constants/theme";
import {
  themeList,
  type ColorTokens,
  type ThemeName,
} from "@/constants/themes";
import { useThemeContext } from "@/contexts/ThemeContext";
import { refreshWidgetTheme } from "@/lib/widget-refresh";
import { useAuthStore } from "@/stores/auth.store";
import { useQueryClient } from "@tanstack/react-query";

export default function SettingsScreen() {
  const { theme, themeName, setThemeName } = useThemeContext();
  const { colors } = theme;
  const router = useRouter();
  const queryClient = useQueryClient();
  const alert = useAlert();
  const s = useMemo(() => buildStyles(colors), [colors]);
  const { data: user } = useUser();

  // Three and a half cards fit on any screen width, so the cut-off card at
  // the edge shows the strip scrolls.
  const { width: windowWidth } = useWindowDimensions();
  const themeCardWidth = (windowWidth - Spacing.lg - Spacing.md * 3) / 3.5;

  const pat = useAuthStore((s) => s.pat);
  const setPat = useAuthStore((s) => s.setPat);
  const [patInput, setPatInput] = useState("");
  const [validating, setValidating] = useState(false);
  const [patError, setPatError] = useState<string | null>(null);

  // rateLimit is a plain mutable object updated by the axios interceptor,
  // not reactive state, so snapshot it fresh each time this screen is
  // focused rather than trying to subscribe to it.
  const [rateLimitSnapshot, setRateLimitSnapshot] = useState(() => ({
    ...rateLimit,
  }));

  useFocusEffect(
    useCallback(() => {
      setRateLimitSnapshot({ ...rateLimit });
    }, []),
  );

  const handleSavePAT = useCallback(async () => {
    const trimmed = patInput.trim();
    if (!trimmed) return;

    if (!trimmed.startsWith("ghp_") && !trimmed.startsWith("github_pat_")) {
      setPatError("Token must start with ghp_ or github_pat_");
      return;
    }

    setValidating(true);
    setPatError(null);

    try {
      const valid = await validatePAT(trimmed);
      setValidating(false);

      if (!valid) {
        setPatError(
          "Invalid token. Make sure it has the 'notifications' scope.",
        );
        return;
      }

      await savePAT(trimmed);
      setPat(trimmed);
      setPatInput("");
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    } catch {
      setValidating(false);
      setPatError("Something went wrong. Please try again.");
    }
  }, [patInput, setPat, queryClient]);

  const handleRemovePAT = useCallback(() => {
    alert.show({
      variant: "danger",
      title: "Remove token",
      message:
        "Notifications will stop working without a Personal Access Token.",
      actions: [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            await deletePAT();
            setPat(null);
            setPatInput("");
            setPatError(null);
            queryClient.invalidateQueries({ queryKey: ["notifications"] });
          },
        },
      ],
    });
  }, [alert, setPat, queryClient]);

  const [alertsOn, setAlertsOn] = useState(false);
  const [alertsBusy, setAlertsBusy] = useState(false);
  const [patRejected, setPatRejected] = useState(false);
  const [lastPoll, setLastPoll] = useState<LastPoll | null>(null);

  // Read fresh on focus: the task can turn itself off in the background (PAT
  // rejected), and the user can block notifications in system settings.
  // Also re-read when the PAT changes: removing it turns alerts off without
  // leaving this screen.
  useFocusEffect(
    useCallback(() => {
      setPatRejected(wasPatRejected());
      setLastPoll(getLastPoll());
      if (!pat) {
        setAlertsOn(false);
        return;
      }
      areAlertsEnabled().then(setAlertsOn).catch(() => setAlertsOn(false));
    }, [pat]),
  );

  const handleToggleAlerts = useCallback(
    async (on: boolean) => {
      setAlertsBusy(true);
      try {
        if (!on) {
          await disableAlerts();
          setAlertsOn(false);
          return;
        }
        const result = await enableAlerts();
        setAlertsOn(result === "enabled");
        if (result === "enabled") {
          setPatRejected(false);
        } else if (result === "blocked") {
          alert.show({
            variant: "danger",
            title: "Notifications are off for Shikai",
            message: "Allow notifications in Android settings, then turn alerts on again.",
            actions: [
              { text: "Cancel", style: "cancel" },
              { text: "Open settings", onPress: () => Linking.openSettings() },
            ],
          });
        } else {
          alert.show({
            variant: "danger",
            title: "Alerts not turned on",
            message:
              result === "denied"
                ? "Shikai needs permission to show notifications."
                : "Android isn't allowing background work for Shikai right now.",
          });
        }
      } catch (error) {
        console.error("[alerts] toggle failed", error);
        alert.show({
          variant: "danger",
          title: "Something went wrong",
          message: "Couldn't change notification alerts. Please try again.",
        });
      } finally {
        setAlertsBusy(false);
      }
    },
    [alert],
  );

  const handleClearCache = useCallback(() => {
    clearAllMMKV();
    queryClient.clear();
    alert.show({
      variant: "success",
      title: "Cache cleared",
      message: "Data will be refetched as you use the app.",
    });
  }, [alert, queryClient]);

  const handleSignOut = useCallback(() => {
    alert.show({
      variant: "danger",
      title: "Sign out",
      message: "Are you sure you want to sign out?",
      actions: [
        { text: "Cancel", style: "cancel" },
        {
          text: "Sign out",
          style: "destructive",
          onPress: () => signOut(queryClient),
        },
      ],
    });
  }, [alert, queryClient]);

  return (
    <KeyboardAvoid>
      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
      >
      {user && (
        <View style={[s.card, s.accountHeader]}>
          <Image
            source={{ uri: user.avatar_url }}
            style={s.avatar}
            contentFit="cover"
          />
          <View style={s.rowBody}>
            <Text style={s.accountName} numberOfLines={1}>
              {user.name || user.login}
            </Text>
            <Text style={s.rowDetail} numberOfLines={1}>
              @{user.login}
            </Text>
          </View>
        </View>
      )}

      <View style={s.section}>
        <Text style={s.sectionTitle}>Appearance</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={s.themeStrip}
          contentContainerStyle={s.themeStripContent}
        >
          {themeList.map((t) => {
            const isActive = t.name === themeName;

            return (
              <Pressable
                key={t.name}
                style={({ pressed }) => [
                  s.themeOption,
                  { width: themeCardWidth },
                  pressed && s.pressed,
                ]}
                onPress={() => {
                  setThemeName(t.name as ThemeName);
                  refreshWidgetTheme(t.name as ThemeName).catch(() => {});
                }}
                accessibilityRole="radio"
                accessibilityState={{ selected: isActive }}
                accessibilityLabel={`${t.label} theme`}
              >
                <View
                  style={[
                    s.themePreview,
                    {
                      backgroundColor: t.colors.background,
                      borderColor: isActive ? colors.accent : colors.border,
                    },
                    isActive && s.themePreviewActive,
                  ]}
                >
                  <View
                    style={[
                      s.themePreviewCard,
                      {
                        backgroundColor: t.colors.surface,
                        borderColor: t.colors.border,
                      },
                    ]}
                  >
                    <View
                      style={[
                        s.themePreviewLine,
                        { backgroundColor: t.colors.textPrimary },
                      ]}
                    />
                    <View
                      style={[
                        s.themePreviewAccent,
                        { backgroundColor: t.colors.accent },
                      ]}
                    />
                  </View>
                  {isActive && (
                    <View style={s.themeCheck}>
                      <Octicons
                        name="check"
                        size={10}
                        color={colors.textOnAccent}
                      />
                    </View>
                  )}
                </View>
                <Text
                  style={[s.themeLabel, isActive && s.themeLabelActive]}
                  numberOfLines={1}
                >
                  {t.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {pat && (
        <View style={s.section}>
          <Text style={s.sectionTitle}>Alerts</Text>
          <View style={s.card}>
            <View style={s.row}>
              <Octicons
                name="bell"
                size={IconSize.md}
                color={colors.textSecondary}
              />
              <View style={s.rowBody}>
                <Text style={s.rowLabel}>Notification alerts</Text>
                <Text style={s.rowDetail}>
                  {patRejected && !alertsOn
                    ? "Turned off because GitHub rejected your token. Add a new token, then turn alerts on again."
                    : "Checks for review requests, mentions and assignments every 15 minutes or so. Android may wait longer to save battery."}
                </Text>
                {alertsOn && (
                  <Text style={s.rowDetail}>
                    {!lastPoll
                      ? "Not checked yet"
                      : lastPoll.outcome === "failed"
                        ? `Last check failed ${relativeTime(lastPoll.at)}`
                        : `Last checked ${relativeTime(lastPoll.at)}`}
                  </Text>
                )}
              </View>
              <Switch
                value={alertsOn}
                onValueChange={handleToggleAlerts}
                disabled={alertsBusy}
                trackColor={{ false: colors.border, true: colors.accent }}
                thumbColor={colors.surface}
                accessibilityLabel="Notification alerts"
              />
            </View>

            {__DEV__ && alertsOn && (
              <Pressable
                style={({ pressed }) => [
                  s.row,
                  s.rowDivider,
                  pressed && s.pressed,
                ]}
                onPress={() => postTestAlert().catch(console.error)}
              >
                <Octicons
                  name="beaker"
                  size={IconSize.md}
                  color={colors.textSecondary}
                />
                <Text style={s.rowLabel}>Post a test alert (dev)</Text>
              </Pressable>
            )}
          </View>
        </View>
      )}

      <View style={s.section}>
        <Text style={s.sectionTitle}>Account</Text>
        <View style={s.card}>
          {pat ? (
            <View style={s.row}>
              <Octicons
                name="key"
                size={IconSize.md}
                color={colors.textSecondary}
              />
              <Text style={s.rowLabel}>Access token</Text>
              <View style={s.tokenStatus}>
                <View style={s.statusDot} />
                <Text style={s.rowDetail}>Active</Text>
              </View>
              <Pressable
                style={({ pressed }) => [s.removeBtn, pressed && s.pressed]}
                onPress={handleRemovePAT}
                hitSlop={8}
              >
                <Text style={s.removeText}>Remove</Text>
              </Pressable>
            </View>
          ) : (
            <View style={s.tokenSetup}>
              <View style={s.tokenSetupHeader}>
                <Octicons
                  name="key"
                  size={IconSize.md}
                  color={colors.textSecondary}
                />
                <Text style={s.rowLabel}>Access token</Text>
              </View>
              <Text style={s.rowDetail}>
                Turns on Notifications, alerts, Your work and issue search. It{" "}
                needs the{" "}
                <Text style={s.bold}>notifications</Text> and{" "}
                <Text style={s.bold}>repo</Text> scopes.{" "}
                <Text
                  style={s.link}
                  onPress={() =>
                    Linking.openURL(
                      "https://github.com/settings/tokens/new?scopes=notifications,repo&description=Shikai%20Notifications",
                    )
                  }
                >
                  Create a token
                </Text>
              </Text>
              <TextInput
                style={s.patInput}
                value={patInput}
                onChangeText={(text) => {
                  setPatInput(text);
                  setPatError(null);
                }}
                placeholder="ghp_xxxx or github_pat_xxxx"
                placeholderTextColor={colors.textMuted}
                autoCapitalize="none"
                autoCorrect={false}
                secureTextEntry
              />
              {patError && <Text style={s.patError}>{patError}</Text>}
              <Pressable
                style={({ pressed }) => [
                  s.saveBtn,
                  (pressed || validating) && s.pressed,
                ]}
                onPress={handleSavePAT}
                disabled={validating || !patInput.trim()}
              >
                {validating ? (
                  <ActivityIndicator size="small" color={colors.textOnAccent} />
                ) : (
                  <Text style={s.saveBtnText}>Save</Text>
                )}
              </Pressable>
            </View>
          )}

          <Pressable
            style={({ pressed }) => [s.row, s.rowDivider, pressed && s.pressed]}
            onPress={() => Linking.openURL(MANAGE_REPO_ACCESS_URL)}
          >
            <Octicons
              name="repo"
              size={IconSize.md}
              color={colors.textSecondary}
            />
            <View style={s.rowBody}>
              <Text style={s.rowLabel}>Manage repository access</Text>
              <Text style={s.rowDetail}>
                Missing private repos? Choose which ones Shikai can see on
                GitHub.
              </Text>
            </View>
            <Octicons name="link-external" size={13} color={colors.textMuted} />
          </Pressable>

          <Pressable
            style={({ pressed }) => [s.row, s.rowDivider, pressed && s.pressed]}
            onPress={handleSignOut}
          >
            <Octicons
              name="sign-out"
              size={IconSize.md}
              color={colors.danger}
            />
            <Text style={[s.rowLabel, s.dangerText]}>Sign out</Text>
          </Pressable>
        </View>
      </View>

      <View style={s.section}>
        <Text style={s.sectionTitle}>Data & About</Text>
        <View style={s.card}>
          <View style={s.row}>
            <Octicons
              name="graph"
              size={IconSize.md}
              color={colors.textSecondary}
            />
            <View style={s.rowBody}>
              <Text style={s.rowLabel}>API rate limit</Text>
              <Text style={s.rowDetail}>
                {rateLimitSnapshot.reset
                  ? `Resets at ${format24HourTime(rateLimitSnapshot.reset.toISOString())}`
                  : "No API activity yet this session"}
              </Text>
            </View>
            {rateLimitSnapshot.remaining !== null &&
              rateLimitSnapshot.limit !== null && (
                <Text style={s.rowValue}>
                  {rateLimitSnapshot.remaining} / {rateLimitSnapshot.limit}
                </Text>
              )}
          </View>

          <Pressable
            style={({ pressed }) => [s.row, s.rowDivider, pressed && s.pressed]}
            onPress={handleClearCache}
          >
            <Octicons
              name="trash"
              size={IconSize.md}
              color={colors.textSecondary}
            />
            <Text style={s.rowLabel}>Clear cache</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [s.row, s.rowDivider, pressed && s.pressed]}
            onPress={() => router.push("/(app)/(tabs)/profile/about" as Href)}
          >
            <Octicons
              name="info"
              size={IconSize.md}
              color={colors.textSecondary}
            />
            <Text style={s.rowLabel}>About Shikai</Text>
            <Octicons name="chevron-right" size={13} color={colors.textMuted} />
          </Pressable>
        </View>
      </View>
      </ScrollView>
    </KeyboardAvoid>
  );
}

function buildStyles(colors: ColorTokens) {
  return StyleSheet.create({
    scroll: {
      flex: 1,
      backgroundColor: colors.background,
    },

    content: {
      paddingHorizontal: Spacing.lg,
      paddingTop: Spacing.xl,
      paddingBottom: Spacing.xxl,
      gap: Spacing.xl,
    },

    section: {
      gap: Spacing.sm,
    },

    sectionTitle: {
      fontFamily: FontFamily.semiBold,
      fontSize: FontSize.label,
      color: colors.textMuted,
      textTransform: "uppercase",
      letterSpacing: 0.5,
      marginBottom: Spacing.xs,
    },

    card: {
      backgroundColor: colors.surface,
      borderRadius: Radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: "hidden",
    },

    accountHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.md,
      padding: Spacing.lg,
    },

    avatar: {
      width: AvatarSize.md,
      height: AvatarSize.md,
      borderRadius: AvatarSize.md / 2,
      backgroundColor: colors.surfaceSecondary,
    },

    accountName: {
      fontFamily: FontFamily.semiBold,
      fontSize: FontSize.title,
      color: colors.textPrimary,
    },

    // Bleeds past the screen padding so cards scroll to the screen edge.
    themeStrip: {
      marginHorizontal: -Spacing.lg,
    },

    themeStripContent: {
      gap: Spacing.md,
      paddingHorizontal: Spacing.lg,
    },

    themeOption: {
      gap: Spacing.xs,
    },

    themePreview: {
      height: 64,
      borderRadius: Radius.md,
      borderWidth: 1,
      padding: Spacing.sm,
      justifyContent: "flex-end",
    },

    themePreviewActive: {
      borderWidth: 2,
    },

    themePreviewCard: {
      borderRadius: Radius.sm,
      borderWidth: 1,
      padding: 6,
      gap: 4,
    },

    themePreviewLine: {
      width: "70%",
      height: 4,
      borderRadius: 2,
      opacity: 0.8,
    },

    themePreviewAccent: {
      width: "40%",
      height: 4,
      borderRadius: 2,
    },

    themeCheck: {
      position: "absolute",
      top: 6,
      right: 6,
      width: 16,
      height: 16,
      borderRadius: 8,
      backgroundColor: colors.accent,
      alignItems: "center",
      justifyContent: "center",
    },

    themeLabel: {
      fontFamily: FontFamily.medium,
      fontSize: FontSize.label,
      color: colors.textSecondary,
      textAlign: "center",
    },

    themeLabelActive: {
      color: colors.textPrimary,
      fontFamily: FontFamily.semiBold,
    },

    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.md,
      paddingVertical: Spacing.md,
      paddingHorizontal: Spacing.lg,
    },

    rowDivider: {
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },

    pressed: {
      opacity: 0.6,
    },

    rowBody: {
      flex: 1,
      gap: 2,
    },

    rowLabel: {
      flex: 1,
      fontFamily: FontFamily.medium,
      fontSize: FontSize.body,
      color: colors.textPrimary,
    },

    rowDetail: {
      fontFamily: FontFamily.regular,
      fontSize: FontSize.caption,
      color: colors.textMuted,
      lineHeight: FontSize.caption * 1.5,
    },

    rowValue: {
      fontFamily: FontFamily.mono,
      fontSize: FontSize.label,
      color: colors.textSecondary,
    },

    dangerText: {
      color: colors.danger,
    },

    tokenStatus: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },

    statusDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.success,
    },

    removeBtn: {
      paddingHorizontal: Spacing.sm,
      paddingVertical: Spacing.xs,
      borderRadius: Radius.sm,
    },

    removeText: {
      fontFamily: FontFamily.medium,
      fontSize: FontSize.label,
      color: colors.danger,
    },

    tokenSetup: {
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.md,
      gap: Spacing.sm,
    },

    tokenSetupHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.md,
    },

    bold: {
      fontFamily: FontFamily.semiBold,
    },

    link: {
      fontFamily: FontFamily.medium,
      color: colors.textLink,
    },

    patInput: {
      fontFamily: FontFamily.mono,
      fontSize: FontSize.label,
      color: colors.textPrimary,
      backgroundColor: colors.surfaceInset,
      borderRadius: Radius.sm,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
    },

    patError: {
      fontFamily: FontFamily.regular,
      fontSize: FontSize.caption,
      color: colors.danger,
    },

    saveBtn: {
      alignItems: "center",
      justifyContent: "center",
      borderRadius: Radius.sm,
      paddingVertical: Spacing.sm,
      backgroundColor: colors.accent,
    },

    saveBtnText: {
      fontFamily: FontFamily.semiBold,
      fontSize: FontSize.label,
      color: colors.textOnAccent,
    },
  });
}
