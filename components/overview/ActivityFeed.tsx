/**
 * Renders recent GitHub activity using REST API events.
 *
 * Shows various event types:
 *   - PushEvent: commits pushed to repository
 *   - WatchEvent: starred a repository
 *   - ForkEvent: forked a repository
 *   - CreateEvent: created repo/branch/tag
 *   - PullRequestEvent: opened/closed/merged PR
 *   - IssuesEvent: opened/closed issue
 *   - ReleaseEvent: published a release
 *   - PublicEvent: made repository public
 *
 * Groups consecutive events of the same type from the same repo/branch.
 * Each item is tappable and opens the relevant URL in browser.
 */

import { Octicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as WebBrowser from "expo-web-browser";
import { useState } from "react";
import {
  ActivityIndicator,
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
import { format24HourTime } from "@/lib/utils";
import type { GitHubEvent } from "@/types/github.types";

interface ActivityFeedProps {
  events: GitHubEvent[];
  isLoading?: boolean;
  onLoadMore?: () => void;
  hasNextPage?: boolean;
  isLoadingMore?: boolean;
}

interface EventDisplay {
  icon: React.ComponentProps<typeof Octicons>["name"];
  iconColor: string;
  primaryText: string;
  secondaryText: string;
  url: string;
}

interface GroupedEvent {
  id: string;
  type: "single" | "group";
  events: GitHubEvent[];
  display: EventDisplay;
  timestamp: string;
}

function getEventDisplay(
  event: GitHubEvent,
  colors: typeof LightColors | typeof DarkColors,
): EventDisplay | null {
  const repoName = event.repo.name.split("/")[1] || event.repo.name;
  const repoUrl = `https://github.com/${event.repo.name}`;

  switch (event.type) {
    case "PushEvent": {
      const payload = event.payload as any;
      const commitCount = payload.size ?? 1;
      const branch =
        (payload.ref as string)?.replace("refs/heads/", "") ?? "main";
      return {
        icon: "repo-push",
        iconColor: colors.accent,
        primaryText: `Pushed ${commitCount} commit${commitCount > 1 ? "s" : ""}`,
        secondaryText: `${repoName} → ${branch}`,
        url:
          payload.commits?.[0]?.url
            ?.replace("api.github.com/repos", "github.com")
            .replace("/commits/", "/commit/") ?? repoUrl,
      };
    }

    case "WatchEvent":
      return {
        icon: "star",
        iconColor: "#f9c513",
        primaryText: "Starred a repository",
        secondaryText: repoName,
        url: repoUrl,
      };

    case "ForkEvent": {
      const payload = event.payload as any;
      const forkName = payload.forkee?.full_name;
      return {
        icon: "repo-forked",
        iconColor: "#58a6ff",
        primaryText: "Forked a repository",
        secondaryText: forkName
          ? `${repoName} → ${forkName.split("/")[1]}`
          : repoName,
        url: payload.forkee?.html_url ?? repoUrl,
      };
    }

    case "CreateEvent": {
      const payload = event.payload as any;
      const refType = payload.ref_type;
      const ref = payload.ref;

      if (refType === "repository") {
        return {
          icon: "repo",
          iconColor: colors.success,
          primaryText: "Created a repository",
          secondaryText: repoName,
          url: repoUrl,
        };
      }

      return {
        icon: refType === "tag" ? "tag" : "git-branch",
        iconColor: colors.success,
        primaryText: `Created ${refType}${ref ? `: ${ref}` : ""}`,
        secondaryText: repoName,
        url: repoUrl,
      };
    }

    case "PullRequestEvent": {
      const payload = event.payload as any;
      const action = payload.action;
      const prNumber = payload.pull_request?.number;
      const merged = payload.pull_request?.merged;

      let iconColor = colors.accent as string;
      let actionText = action;

      if (merged) {
        iconColor = "#a371f7";
        actionText = "merged";
      } else if (action === "closed") {
        iconColor = colors.danger;
      }

      return {
        icon: "git-pull-request",
        iconColor,
        primaryText: `${actionText.charAt(0).toUpperCase() + actionText.slice(1)} PR${prNumber ? ` #${prNumber}` : ""}`,
        secondaryText: repoName,
        url: payload.pull_request?.html_url ?? repoUrl,
      };
    }

    case "IssuesEvent": {
      const payload = event.payload as any;
      const action = payload.action;
      const issueNumber = payload.issue?.number;

      return {
        icon: action === "closed" ? "issue-closed" : "issue-opened",
        iconColor: action === "closed" ? "#a371f7" : colors.success,
        primaryText: `${action.charAt(0).toUpperCase() + action.slice(1)} issue${issueNumber ? ` #${issueNumber}` : ""}`,
        secondaryText: repoName,
        url: payload.issue?.html_url ?? repoUrl,
      };
    }

    case "ReleaseEvent": {
      const payload = event.payload as any;
      const tagName = payload.release?.tag_name;

      return {
        icon: "tag",
        iconColor: "#f97316",
        primaryText: `Released${tagName ? ` ${tagName}` : " a new version"}`,
        secondaryText: repoName,
        url: payload.release?.html_url ?? repoUrl,
      };
    }

    case "PublicEvent":
      return {
        icon: "repo",
        iconColor: colors.success,
        primaryText: "Made repository public",
        secondaryText: repoName,
        url: repoUrl,
      };

    default:
      return null;
  }
}

function getGroupKey(event: GitHubEvent): string {
  const repoName = event.repo.name;

  switch (event.type) {
    case "PushEvent": {
      const payload = event.payload as any;
      const branch =
        (payload.ref as string)?.replace("refs/heads/", "") ?? "main";
      return `${event.type}:${repoName}:${branch}`;
    }
    default:
      return `${event.type}:${repoName}`;
  }
}

function groupEvents(
  events: GitHubEvent[],
  colors: typeof LightColors | typeof DarkColors,
): GroupedEvent[] {
  const grouped: GroupedEvent[] = [];
  let currentGroup: GitHubEvent[] = [];
  let currentKey: string | null = null;

  for (const event of events) {
    const key = getGroupKey(event);

    if (key === currentKey) {
      currentGroup.push(event);
    } else {
      if (currentGroup.length > 0) {
        const firstEvent = currentGroup[0];
        const display = getEventDisplay(firstEvent, colors);

        if (display) {
          if (currentGroup.length === 1) {
            grouped.push({
              id: firstEvent.id,
              type: "single",
              events: currentGroup,
              display,
              timestamp: format24HourTime(firstEvent.created_at),
            });
          } else {
            const totalCommits = currentGroup.reduce((sum, e) => {
              if (e.type === "PushEvent") {
                const payload = e.payload as any;
                return sum + (payload.size ?? 1);
              }
              return sum + 1;
            }, 0);

            const groupDisplay = { ...display };
            if (firstEvent.type === "PushEvent") {
              groupDisplay.primaryText = `Pushed ${totalCommits} commit${totalCommits > 1 ? "s" : ""}`;
            } else {
              groupDisplay.primaryText = `${currentGroup.length} × ${display.primaryText}`;
            }

            grouped.push({
              id: `group-${firstEvent.id}`,
              type: "group",
              events: currentGroup,
              display: groupDisplay,
              timestamp: format24HourTime(firstEvent.created_at),
            });
          }
        }
      }

      currentGroup = [event];
      currentKey = key;
    }
  }

  if (currentGroup.length > 0) {
    const firstEvent = currentGroup[0];
    const display = getEventDisplay(firstEvent, colors);

    if (display) {
      if (currentGroup.length === 1) {
        grouped.push({
          id: firstEvent.id,
          type: "single",
          events: currentGroup,
          display,
          timestamp: format24HourTime(firstEvent.created_at),
        });
      } else {
        const totalCommits = currentGroup.reduce((sum, e) => {
          if (e.type === "PushEvent") {
            const payload = e.payload as any;
            return sum + (payload.size ?? 1);
          }
          return sum + 1;
        }, 0);

        const groupDisplay = { ...display };
        if (firstEvent.type === "PushEvent") {
          groupDisplay.primaryText = `Pushed ${totalCommits} commit${totalCommits > 1 ? "s" : ""}`;
        } else {
          groupDisplay.primaryText = `${currentGroup.length} × ${display.primaryText}`;
        }

        grouped.push({
          id: `group-${firstEvent.id}`,
          type: "group",
          events: currentGroup,
          display: groupDisplay,
          timestamp: format24HourTime(firstEvent.created_at),
        });
      }
    }
  }

  return grouped;
}

export function ActivityFeed({
  events,
  isLoading = false,
  onLoadMore,
  hasNextPage = false,
  isLoadingMore = false,
}: ActivityFeedProps) {
  const isDark = useColorScheme() === "dark";
  const colors = isDark ? DarkColors : LightColors;
  const s = buildStyles(colors);

  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  const handleEventPress = async (url: string) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await WebBrowser.openBrowserAsync(url);
  };

  const toggleGroup = (groupId: string) => {
    setExpandedGroups((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(groupId)) {
        newSet.delete(groupId);
      } else {
        newSet.add(groupId);
      }
      return newSet;
    });
  };

  if (isLoading) {
    return (
      <View style={s.container}>
        <Text style={s.sectionTitle}>Recent Activity</Text>
        {Array.from({ length: 5 }).map((_, i) => (
          <View key={i} style={s.skeletonItem}>
            <View style={s.skeletonIcon} />
            <View style={{ flex: 1, gap: 6 }}>
              <View style={[s.skeletonLine, { width: "70%" }]} />
              <View style={[s.skeletonLine, { width: "45%" }]} />
            </View>
          </View>
        ))}
      </View>
    );
  }

  if (!events.length) {
    return (
      <View style={s.container}>
        <Text style={s.sectionTitle}>Recent Activity</Text>
        <Text style={s.emptyText}>No recent activity to show.</Text>
      </View>
    );
  }

  const groupedEvents = groupEvents(events, colors);

  return (
    <View style={s.container}>
      <Text style={s.sectionTitle}>Recent Activity</Text>
      {groupedEvents.map((group) => {
        const isExpanded = expandedGroups.has(group.id);
        const isGroup = group.type === "group";

        return (
          <View key={group.id}>
            <Pressable
              style={({ pressed }) => [s.item, pressed && s.itemPressed]}
              onPress={() => {
                if (isGroup) {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  toggleGroup(group.id);
                } else {
                  handleEventPress(group.display.url);
                }
              }}
            >
              <View
                style={[
                  s.iconWrap,
                  { backgroundColor: `${group.display.iconColor}18` },
                ]}
              >
                <Octicons
                  name={group.display.icon}
                  size={14}
                  color={group.display.iconColor}
                />
              </View>

              <View style={s.itemText}>
                <Text style={s.itemLabel} numberOfLines={1}>
                  {group.display.primaryText}
                </Text>
                <View style={s.repoRow}>
                  <Text style={s.itemRepo} numberOfLines={1}>
                    {group.display.secondaryText}
                  </Text>
                  {group.events[0].public === false && (
                    <Octicons
                      name="lock"
                      size={10}
                      color={colors.textMuted}
                      style={s.lockIcon}
                    />
                  )}
                </View>
              </View>

              <Text style={s.timestamp}>{group.timestamp}</Text>

              {isGroup && (
                <Octicons
                  name={isExpanded ? "chevron-up" : "chevron-down"}
                  size={14}
                  color={colors.textMuted}
                  style={s.chevron}
                />
              )}
            </Pressable>

            {isGroup && isExpanded && (
              <View style={s.expandedGroup}>
                {group.events.map((event, index) => {
                  const display = getEventDisplay(event, colors);
                  if (!display) return null;

                  const time = format24HourTime(event.created_at);

                  let itemText = display.primaryText;
                  if (event.type === "PushEvent") {
                    const payload = event.payload as any;
                    const commitSha =
                      payload.head?.substring(0, 7) ??
                      payload.commits?.[0]?.sha?.substring(0, 7);
                    const commitMessage =
                      payload.commits?.[0]?.message?.split("\n")[0];
                    itemText = commitSha
                      ? `${commitSha}${commitMessage ? `: ${commitMessage}` : ""}`
                      : (commitMessage ?? display.primaryText);
                  }

                  return (
                    <Pressable
                      key={event.id}
                      style={({ pressed }) => [
                        s.expandedItem,
                        pressed && s.itemPressed,
                      ]}
                      onPress={() => handleEventPress(display.url)}
                    >
                      <View style={s.expandedItemContent}>
                        <View style={s.expandedItemDot} />
                        <Text style={s.expandedItemText} numberOfLines={1}>
                          {itemText}
                        </Text>
                      </View>
                      <Text style={s.expandedItemTime}>{time}</Text>
                    </Pressable>
                  );
                })}
              </View>
            )}
          </View>
        );
      })}

      {hasNextPage && (
        <Pressable
          style={({ pressed }) => [
            s.loadMoreButton,
            pressed && s.loadMoreButtonPressed,
          ]}
          onPress={onLoadMore}
          disabled={isLoadingMore}
        >
          {isLoadingMore ? (
            <ActivityIndicator size="small" color={colors.accent} />
          ) : (
            <Text style={s.loadMoreText}>Load more</Text>
          )}
        </Pressable>
      )}
    </View>
  );
}

function buildStyles(colors: typeof LightColors | typeof DarkColors) {
  return StyleSheet.create({
    container: {
      gap: Spacing.sm,
    },

    sectionTitle: {
      fontFamily: FontFamily.semiBold,
      fontSize: FontSize.title,
      color: colors.textPrimary,
      marginBottom: Spacing.xs,
    },

    item: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.md,
      paddingVertical: Spacing.xs,
      borderRadius: Radius.sm,
    },

    itemPressed: {
      opacity: 0.6,
    },

    iconWrap: {
      width: 32,
      height: 32,
      borderRadius: Radius.sm,
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
    },

    itemText: {
      flex: 1,
      gap: 2,
    },

    itemLabel: {
      fontFamily: FontFamily.medium,
      fontSize: FontSize.label,
      color: colors.textPrimary,
    },

    repoRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },

    itemRepo: {
      fontFamily: FontFamily.regular,
      fontSize: FontSize.caption,
      color: colors.textSecondary,
      flexShrink: 1,
    },

    lockIcon: {
      marginLeft: 2,
    },

    timestamp: {
      fontFamily: FontFamily.regular,
      fontSize: FontSize.caption,
      color: colors.textMuted,
      flexShrink: 0,
    },

    chevron: {
      marginLeft: Spacing.xs,
      flexShrink: 0,
    },

    expandedGroup: {
      marginLeft: 32 + Spacing.md,
      gap: 2,
      paddingVertical: Spacing.xs,
    },

    expandedItem: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: Spacing.sm,
      paddingVertical: Spacing.xs,
      borderRadius: Radius.sm,
    },

    expandedItemContent: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.sm,
    },

    expandedItemDot: {
      width: 4,
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.textMuted,
      flexShrink: 0,
    },

    expandedItemText: {
      fontFamily: FontFamily.regular,
      fontSize: FontSize.caption,
      color: colors.textSecondary,
      flex: 1,
    },

    expandedItemTime: {
      fontFamily: FontFamily.regular,
      fontSize: FontSize.caption,
      color: colors.textMuted,
      flexShrink: 0,
    },

    loadMoreButton: {
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: Spacing.md,
      paddingHorizontal: Spacing.lg,
      borderRadius: Radius.md,
      backgroundColor: colors.surfaceSecondary,
      marginTop: Spacing.xs,
    },

    loadMoreButtonPressed: {
      opacity: 0.7,
    },

    loadMoreText: {
      fontFamily: FontFamily.medium,
      fontSize: FontSize.label,
      color: colors.accent,
    },

    emptyText: {
      fontFamily: FontFamily.regular,
      fontSize: FontSize.body,
      color: colors.textMuted,
      textAlign: "center",
      paddingVertical: Spacing.xl,
    },

    skeletonItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.md,
      paddingVertical: Spacing.xs,
    },

    skeletonIcon: {
      width: 32,
      height: 32,
      borderRadius: Radius.sm,
      backgroundColor: colors.surfaceSecondary,
      flexShrink: 0,
    },

    skeletonLine: {
      height: 10,
      borderRadius: 4,
      backgroundColor: colors.surfaceSecondary,
    },
  });
}
