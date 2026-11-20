import type {
  GitHubComment,
  GitHubTimelineCrossReferencedEvent,
  GitHubTimelineEvent,
  GitHubTimelineForcePushEvent,
  GitHubTimelineLabelEvent,
  GitHubTimelineStateEvent,
} from "@/types/github.types";

const RENDERABLE_EVENTS = new Set([
  "labeled",
  "unlabeled",
  "closed",
  "reopened",
  "merged",
  "head_ref_force_pushed",
  "base_ref_force_pushed",
  "cross-referenced",
]);

export type RenderableTimelineEvent =
  | GitHubTimelineLabelEvent
  | GitHubTimelineStateEvent
  | GitHubTimelineForcePushEvent
  | GitHubTimelineCrossReferencedEvent;

function isRenderableTimelineEvent(event: GitHubTimelineEvent): event is RenderableTimelineEvent {
  return RENDERABLE_EVENTS.has(event.event);
}

export interface CommentItem {
  kind: "comment";
  created_at: string;
  comment: GitHubComment;
}

export interface EventItem {
  kind: "event";
  created_at: string;
  event: RenderableTimelineEvent;
}

export type TimelineItem = CommentItem | EventItem;

export function mergeCommentsWithTimeline(
  comments: GitHubComment[],
  events: GitHubTimelineEvent[],
): TimelineItem[] {
  const items: TimelineItem[] = [
    ...comments.map((comment): CommentItem => ({
      kind: "comment",
      created_at: comment.created_at,
      comment,
    })),
    ...events.filter(isRenderableTimelineEvent).map((event): EventItem => ({
      kind: "event",
      created_at: event.created_at,
      event,
    })),
  ];

  return items.sort((a, b) => a.created_at.localeCompare(b.created_at));
}
