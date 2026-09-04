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

// Named directly (not derived via Exclude<GitHubTimelineEvent, Unknown>):
// GitHubTimelineUnknownEvent's `event: string` is a supertype of every other
// variant's literal `event`, so Exclude would collapse the whole union to
// `never` instead of narrowing it.
export type RenderableTimelineEvent =
  | GitHubTimelineLabelEvent
  | GitHubTimelineStateEvent
  | GitHubTimelineForcePushEvent
  | GitHubTimelineCrossReferencedEvent;

function isRenderableTimelineEvent(
  event: GitHubTimelineEvent,
): event is RenderableTimelineEvent {
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

/**
 * The timeline API already returns comments interleaved with events, but we
 * keep using the existing (well-tested) comments fetch for the comment cards
 * themselves and only pull the timeline for the event types it doesn't
 * cover, merging both by created_at.
 */
export function mergeCommentsWithTimeline(
  comments: GitHubComment[],
  events: GitHubTimelineEvent[],
): TimelineItem[] {
  const items: TimelineItem[] = [
    ...comments.map(
      (comment): CommentItem => ({
        kind: "comment",
        created_at: comment.created_at,
        comment,
      }),
    ),
    ...events.filter(isRenderableTimelineEvent).map(
      (event): EventItem => ({
        kind: "event",
        created_at: event.created_at,
        event,
      }),
    ),
  ];

  return items.sort((a, b) => a.created_at.localeCompare(b.created_at));
}
