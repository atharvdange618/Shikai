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
