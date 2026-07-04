export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

export type HealthBadge = {
  label: string;
  icon: string;
  color: "warning" | "danger";
  description: string;
};

export function getHealthBadges(
  repo:
    | {
      license: { spdx_id: string } | null;
      topics: string[];
      pushed_at: string;
    }
    | undefined,
  readme: string | undefined,
  isLoading: boolean,
): HealthBadge[] {
  if (isLoading || !repo) return [];
  const badges: HealthBadge[] = [];

  if (!repo.license || repo.license.spdx_id === "NOASSERTION") {
    badges.push({
      label: "No license",
      icon: "law",
      color: "warning",
      description:
        "This repository has no open source license. Others may not be legally allowed to use, modify, or distribute the code.",
    });
  }
  if (repo.topics.length === 0) {
    badges.push({
      label: "No topics",
      icon: "tag",
      color: "warning",
      description:
        "Topics help others discover this repository through search. Adding 3-5 relevant tags improves visibility.",
    });
  }
  if (readme === undefined) {
    badges.push({
      label: "No README",
      icon: "file-directory",
      color: "warning",
      description:
        "No README file found. A README explains what the project does and how to use it - essential for new visitors and contributors.",
    });
  }

  const daysSincePush =
    (Date.now() - new Date(repo.pushed_at).getTime()) / 86_400_000;
  if (daysSincePush > 90) {
    badges.push({
      label: "Stale",
      icon: "alert",
      color: daysSincePush > 180 ? "danger" : "warning",
      description:
        daysSincePush > 180
          ? `No commits in over 6 months (${Math.floor(daysSincePush)} days). This project may be abandoned.`
          : `No commits in ${Math.floor(daysSincePush)} days. The project may need attention.`,
    });
  }

  return badges;
}
