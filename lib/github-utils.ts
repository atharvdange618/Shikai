import type { ColorTokens } from "@/constants/theme";
import type { GitHubEvent } from "@/types/github.types";
import type { Octicons } from "@expo/vector-icons";

export interface EventDisplay {
  icon: React.ComponentProps<typeof Octicons>["name"];
  iconColor: string;
  primaryText: string;
  secondaryText: string;
  url: string;
}

export function getEventDisplay(
  event: GitHubEvent,
  colors: ColorTokens,
): EventDisplay | null {
  const repoName = event.repo.name.split("/")[1] || event.repo.name;
  const repoUrl = `https://github.com/${event.repo.name}`;

  switch (event.type) {
    case "PushEvent": {
      const payload = event.payload;
      const commitCount = payload.size ?? 1;
      const branch = payload.ref?.replace("refs/heads/", "") ?? "main";
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
      const payload = event.payload;
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
      const payload = event.payload;
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
      const payload = event.payload;
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
      const payload = event.payload;
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
      const payload = event.payload;
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
