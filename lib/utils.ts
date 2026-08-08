export function compactTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks}w`;
  const months = Math.floor(days / 30);
  return `${months}mo`;
}

export function relativeTime(dateStr: string): string {
  if (!dateStr) return "";
  const dateMs = new Date(dateStr).getTime();
  if (Number.isNaN(dateMs)) return "";
  const diff = Date.now() - dateMs;
  const mins = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days = Math.floor(diff / 86_400_000);

  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

export function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}m`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

export function format24HourTime(isoDate: string): string {
  const date = new Date(isoDate);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();

  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");

  if (isToday) {
    return `${hours}:${minutes}`;
  }

  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const month = months[date.getMonth()];
  const day = date.getDate();

  return `${month} ${day}, ${hours}:${minutes}`;
}

const IMAGE_EXTENSIONS = [
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".svg",
  ".webp",
  ".bmp",
  ".ico",
];

export function isImageFile(filename: string): boolean {
  return IMAGE_EXTENSIONS.some((ext) => filename.toLowerCase().endsWith(ext));
}

const VIDEO_EXTENSIONS = [".mp4", ".mov", ".webm", ".mkv", ".avi", ".m4v"];

export function isVideoFile(filename: string): boolean {
  return VIDEO_EXTENSIONS.some((ext) => filename.toLowerCase().endsWith(ext));
}

const REPO_ID_SEPARATOR = "~~";

export function encodeRepoId(owner: string, name: string): string {
  return `${owner}${REPO_ID_SEPARATOR}${name}`;
}

export function decodeRepoId(repoId: string): [string, string] {
  const idx = repoId.indexOf(REPO_ID_SEPARATOR);
  if (idx === -1) return [repoId, ""];
  return [repoId.slice(0, idx), repoId.slice(idx + REPO_ID_SEPARATOR.length)];
}

export function getLanguage(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "js":
    case "jsx":
      return "javascript";
    case "ts":
    case "tsx":
      return "typescript";
    case "py":
      return "python";
    case "rb":
      return "ruby";
    case "java":
      return "java";
    case "cpp":
    case "cxx":
    case "cc":
    case "ino":
      return "cpp";
    case "c":
      return "c";
    case "go":
      return "go";
    case "rs":
      return "rust";
    case "php":
      return "php";
    case "cs":
      return "csharp";
    case "swift":
      return "swift";
    case "kt":
    case "kts":
      return "kotlin";
    case "scala":
      return "scala";
    case "html":
      return "html";
    case "css":
      return "css";
    case "scss":
      return "scss";
    case "json":
      return "json";
    case "md":
      return "markdown";
    case "yml":
    case "yaml":
      return "yaml";
    case "xml":
    case "svg":
      return "xml";
    case "sql":
      return "sql";
    case "sh":
    case "bash":
      return "bash";
    default:
      return "text";
  }
}

export function parseGitHubUrl(url: string): string | null {
  const match = url.match(
    /github\.com\/([^/]+)\/([^/]+)(?:\/(issues|pull)\/(\d+))?/,
  );
  if (!match) return null;
  const [, owner, repo, type, number] = match;
  const repoId = encodeRepoId(owner, repo);
  if (type === "issues" && number)
    return `/(app)/repo/${repoId}/issue/${number}`;
  if (type === "pull" && number) return `/(app)/repo/${repoId}/pr/${number}`;
  return `/(app)/repo/${repoId}`;
}
