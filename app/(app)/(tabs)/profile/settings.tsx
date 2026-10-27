import { Octicons } from "@expo/vector-icons";
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
} from "react-native";

import { useAlert } from "@/components/shared/Alert";
import { KeyboardAvoid } from "@/components/shared/KeyboardAvoid";
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
  useFocusEffect(
    useCallback(() => {
      areAlertsEnabled().then(setAlertsOn).catch(() => setAlertsOn(false));
      setPatRejected(wasPatRejected());
      setLastPoll(getLastPoll());
    }, []),
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
      <View style={s.section}>
        <Text style={s.sectionTitle}>Appearance</Text>
        <View style={s.card}>
          {themeList.map((t, i) => {
            const isActive = t.name === themeName;
            const isLast = i === themeList.length - 1;

            return (
              <Pressable
                key={t.name}
                style={({ pressed }) => [
                  s.themeRow,
                  !isLast && s.themeRowBorder,
                  pressed && s.themeRowPressed,
                ]}
                onPress={() => {
                  setThemeName(t.name as ThemeName);
                  refreshWidgetTheme(t.name as ThemeName).catch(() => {});
                }}
              >
                <View style={s.themeInfo}>
                  <View style={s.themeDots}>
                    <View
                      style={[s.dot, { backgroundColor: t.colors.background }]}
                    />
                    <View
                      style={[s.dot, { backgroundColor: t.colors.accent }]}
                    />
                    <View
                      style={[s.dot, { backgroundColor: t.colors.textPrimary }]}
                    />
                  </View>
                  <Text style={[s.themeLabel, isActive && s.themeLabelActive]}>
                    {t.label}
                  </Text>
                </View>
                {isActive && (
                  <Octicons name="check" size={16} color={colors.accent} />
                )}
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={s.section}>
        <Text style={s.sectionTitle}>Notifications & Following</Text>
        <View style={s.card}>
          <View style={s.patInfo}>
            <Text style={s.patDescription}>
              A Personal Access Token enables the Notifications tab and the
              Following activity feed. Without one, these features are hidden.
            </Text>
            <Pressable
              onPress={() =>
                Linking.openURL(
                  "https://github.com/settings/tokens/new?scopes=notifications,repo&description=Shikai%20Notifications",
                )
              }
            >
              <Text style={s.patLink}>Create a token here</Text>
            </Pressable>
            <Text style={s.patDescription}>
              with the <Text style={s.patBold}>notifications</Text> and{" "}
              <Text style={s.patBold}>repo</Text> scopes, then paste it below.
            </Text>
          </View>

          {pat ? (
            <View style={s.patActiveRow}>
              <View style={s.patActiveInfo}>
                <View style={[s.patDot, { backgroundColor: colors.success }]} />
                <Text style={s.patActiveText}>Token configured</Text>
              </View>
              <Pressable
                style={({ pressed }) => [
                  s.patRemoveBtn,
                  pressed && s.menuRowPressed,
                ]}
                onPress={handleRemovePAT}
              >
                <Text style={s.patRemoveText}>Remove</Text>
              </Pressable>
            </View>
          ) : (
            <View style={s.patInputContainer}>
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
              {patError && (
                <Text style={[s.patError, { color: colors.danger }]}>
                  {patError}
                </Text>
              )}
              <Pressable
                style={({ pressed }) => [
                  s.patSaveBtn,
                  { backgroundColor: colors.accent },
                  (pressed || validating) && s.menuRowPressed,
                ]}
                onPress={handleSavePAT}
                disabled={validating || !patInput.trim()}
              >
                {validating ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={s.patSaveBtnText}>Save</Text>
                )}
              </Pressable>
            </View>
          )}

          {pat && (
            <View style={[s.menuRow, s.rateLimitDivider]}>
              <Octicons
                name="bell"
                size={IconSize.md}
                color={colors.textSecondary}
              />
              <View style={s.rateLimitInfo}>
                <Text style={s.menuText}>Notification alerts</Text>
                <Text style={s.rateLimitDetail}>
                  {patRejected && !alertsOn
                    ? "Turned off because GitHub rejected your token. Add a new token, then turn alerts on again."
                    : "Checks for review requests, mentions and assignments every 15 minutes or so. Android can stretch that to an hour or more to save battery."}
                </Text>
                {alertsOn && (
                  <Text style={s.rateLimitDetail}>
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
          )}

          {__DEV__ && pat && alertsOn && (
            <Pressable
              style={({ pressed }) => [
                s.menuRow,
                s.rateLimitDivider,
                pressed && s.menuRowPressed,
              ]}
              onPress={() => postTestAlert().catch(console.error)}
            >
              <Octicons
                name="beaker"
                size={IconSize.md}
                color={colors.textSecondary}
              />
              <Text style={s.menuText}>Post a test alert (dev)</Text>
            </Pressable>
          )}
        </View>
      </View>

      <View style={s.section}>
        <Text style={s.sectionTitle}>Data & Storage</Text>
        <View style={s.card}>
          <View style={s.menuRow}>
            <Octicons
              name="graph"
              size={IconSize.md}
              color={colors.textSecondary}
            />
            <View style={s.rateLimitInfo}>
              <Text style={s.menuText}>API rate limit</Text>
              <Text style={s.rateLimitDetail}>
                {rateLimitSnapshot.remaining !== null &&
                rateLimitSnapshot.limit !== null
                  ? `${rateLimitSnapshot.remaining} / ${rateLimitSnapshot.limit} requests remaining` +
                    (rateLimitSnapshot.reset
                      ? `, resets at ${format24HourTime(rateLimitSnapshot.reset.toISOString())}`
                      : "")
                  : "No API activity yet this session"}
              </Text>
            </View>
          </View>
          <Pressable
            style={({ pressed }) => [
              s.menuRow,
              s.rateLimitDivider,
              pressed && s.menuRowPressed,
            ]}
            onPress={handleClearCache}
          >
            <Octicons
              name="trash"
              size={IconSize.md}
              color={colors.textSecondary}
            />
            <Text style={s.menuText}>Clear cache</Text>
          </Pressable>
        </View>
      </View>

      <View style={s.section}>
        <Text style={s.sectionTitle}>About</Text>
        <View style={s.card}>
          <Pressable
            style={({ pressed }) => [s.menuRow, pressed && s.menuRowPressed]}
            onPress={() => router.push("/(app)/(tabs)/profile/about" as Href)}
          >
            <Octicons
              name="info"
              size={IconSize.md}
              color={colors.textSecondary}
            />
            <Text style={s.menuText}>About Shikai</Text>
            <Octicons name="chevron-right" size={13} color={colors.textMuted} />
          </Pressable>
        </View>
      </View>

      <View style={s.section}>
        <Text style={s.sectionTitle}>Account</Text>
        <View style={s.card}>
          <Pressable
            style={({ pressed }) => [s.menuRow, pressed && s.menuRowPressed]}
            onPress={() => Linking.openURL(MANAGE_REPO_ACCESS_URL)}
          >
            <Octicons
              name="repo"
              size={IconSize.md}
              color={colors.textSecondary}
            />
            <View style={s.rateLimitInfo}>
              <Text style={s.menuText}>Manage repository access</Text>
              <Text style={s.rateLimitDetail}>
                Missing private repos? Choose which ones Shikai can see on
                GitHub.
              </Text>
            </View>
            <Octicons name="link-external" size={13} color={colors.textMuted} />
          </Pressable>
        </View>
        <View style={s.dangerCard}>
          <Pressable
            style={({ pressed }) => [
              s.menuRow,
              s.dangerRow,
              pressed && s.menuRowPressed,
            ]}
            onPress={handleSignOut}
          >
            <Octicons
              name="sign-out"
              size={IconSize.md}
              color={colors.danger}
            />
            <Text style={s.dangerText}>Sign out</Text>
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

    dangerCard: {
      backgroundColor: colors.surface,
      borderRadius: Radius.lg,
      borderWidth: 1,
      borderColor: colors.dangerSubtle,
      overflow: "hidden",
    },

    themeRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: Spacing.md,
      paddingHorizontal: Spacing.lg,
    },

    themeRowBorder: {
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },

    themeRowPressed: {
      opacity: 0.6,
    },

    themeInfo: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.md,
    },

    themeDots: {
      flexDirection: "row",
      gap: 4,
    },

    dot: {
      width: 14,
      height: 14,
      borderRadius: 7,
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.1)",
    },

    themeLabel: {
      fontFamily: FontFamily.medium,
      fontSize: FontSize.body,
      color: colors.textSecondary,
    },

    themeLabelActive: {
      color: colors.textPrimary,
      fontFamily: FontFamily.semiBold,
    },

    menuRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.md,
      paddingVertical: Spacing.md,
      paddingHorizontal: Spacing.lg,
    },

    menuRowPressed: {
      opacity: 0.6,
    },

    menuText: {
      flex: 1,
      fontFamily: FontFamily.medium,
      fontSize: FontSize.body,
      color: colors.textSecondary,
    },

    dangerRow: {
      gap: Spacing.md,
    },

    rateLimitInfo: {
      flex: 1,
      gap: 2,
    },

    rateLimitDetail: {
      fontFamily: FontFamily.regular,
      fontSize: FontSize.caption,
      color: colors.textMuted,
    },

    rateLimitDivider: {
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },

    dangerText: {
      flex: 1,
      fontFamily: FontFamily.medium,
      fontSize: FontSize.body,
      color: colors.danger,
    },

    patInfo: {
      paddingHorizontal: Spacing.lg,
      paddingTop: Spacing.md,
      paddingBottom: Spacing.sm,
      gap: 2,
    },

    patDescription: {
      fontFamily: FontFamily.regular,
      fontSize: FontSize.caption,
      color: colors.textMuted,
      lineHeight: FontSize.caption * 1.5,
    },

    patLink: {
      fontFamily: FontFamily.medium,
      fontSize: FontSize.caption,
      color: colors.accent,
      textDecorationLine: "underline",
    },

    patBold: {
      fontFamily: FontFamily.semiBold,
    },

    patActiveRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: Spacing.md,
      paddingHorizontal: Spacing.lg,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },

    patActiveInfo: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.sm,
    },

    patDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },

    patActiveText: {
      fontFamily: FontFamily.medium,
      fontSize: FontSize.body,
      color: colors.textSecondary,
    },

    patRemoveBtn: {
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.xs,
      borderRadius: Radius.sm,
    },

    patRemoveText: {
      fontFamily: FontFamily.medium,
      fontSize: FontSize.caption,
      color: colors.danger,
    },

    patInputContainer: {
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.md,
      gap: Spacing.sm,
      borderTopWidth: 1,
      borderTopColor: colors.border,
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
    },

    patSaveBtn: {
      alignItems: "center",
      justifyContent: "center",
      borderRadius: Radius.sm,
      paddingVertical: Spacing.sm,
    },

    patSaveBtnText: {
      fontFamily: FontFamily.semiBold,
      fontSize: FontSize.label,
      color: "#fff",
    },
  });
}
