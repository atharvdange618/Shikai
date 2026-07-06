"use no memo";

import React from "react";

import { FlexWidget, TextWidget } from "react-native-android-widget";
import type {
  WidgetContributionDay,
  WidgetContributionWeek,
} from "../lib/widget-data";

export interface WidgetThemeColors {
  bg: `#${string}`;
  text: `#${string}`;
  muted: `#${string}`;
  empty: `#${string}`;
  l1: `#${string}`;
  l2: `#${string}`;
  l3: `#${string}`;
  l4: `#${string}`;
}

export const DEFAULT_WIDGET_COLORS: WidgetThemeColors = {
  bg: "#161B22",
  text: "#E6EDF3",
  muted: "#6E7681",
  empty: "#161B22",
  l1: "#0E4429",
  l2: "#006D32",
  l3: "#26A641",
  l4: "#39D353",
};

interface Props {
  totalContributions: number;
  weeks: WidgetContributionWeek[];
  currentStreak: number;
  longestStreak: number;
  themeColors?: WidgetThemeColors;
  widgetWidth?: number;
  widgetHeight?: number;
}

function levelColor(
  level: WidgetContributionDay["contributionLevel"],
  c: WidgetThemeColors,
): `#${string}` {
  switch (level) {
    case "FIRST_QUARTILE":
      return c.l1;
    case "SECOND_QUARTILE":
      return c.l2;
    case "THIRD_QUARTILE":
      return c.l3;
    case "FOURTH_QUARTILE":
      return c.l4;
    default:
      return c.empty;
  }
}

const CELL_GAP = 2;
const PADDING = 12;
const HEADER_HEIGHT = 26;
const FOOTER_HEIGHT = 14;

function calcLayout(widgetWidth: number, widgetHeight: number) {
  const graphHeight =
    widgetHeight - PADDING * 2 - HEADER_HEIGHT - FOOTER_HEIGHT - 16;
  const cellSize = Math.max(4, Math.floor((graphHeight - CELL_GAP * 6) / 7));
  const colWidth = cellSize + CELL_GAP;
  const graphWidth = widgetWidth - PADDING * 2;
  const weeksToShow = Math.max(8, Math.floor(graphWidth / colWidth));
  return { cellSize, weeksToShow };
}

export function ContributionWidget({
  totalContributions,
  weeks,
  currentStreak,
  longestStreak,
  themeColors = DEFAULT_WIDGET_COLORS,
  widgetWidth = 250,
  widgetHeight = 110,
}: Props) {
  const c = themeColors;
  const { cellSize, weeksToShow } = calcLayout(widgetWidth, widgetHeight);
  const recentWeeks = weeks.slice(-weeksToShow);

  return (
    <FlexWidget
      style={{
        height: "match_parent",
        width: "match_parent",
        backgroundColor: c.bg,
        borderRadius: 16,
        padding: PADDING,
        justifyContent: "space-between",
      }}
      clickAction="OPEN_APP"
      accessibilityLabel={`GitHub contribution widget. ${currentStreak} day streak. ${totalContributions} contributions this year.`}
    >
      <FlexWidget style={{ flexDirection: "row", alignItems: "center" }}>
        <TextWidget
          text={currentStreak.toString()}
          style={{
            fontSize: 20,
            fontFamily: "Inter",
            fontWeight: "700",
            color: c.text,
          }}
        />
        <FlexWidget style={{ flexDirection: "column", marginLeft: 6 }}>
          <TextWidget
            text="day streak"
            style={{ fontSize: 11, fontFamily: "Inter", color: c.muted }}
          />
          <TextWidget
            text={`best: ${longestStreak}`}
            style={{ fontSize: 9, fontFamily: "Inter", color: c.muted }}
          />
        </FlexWidget>
      </FlexWidget>

      <FlexWidget
        style={{
          flexDirection: "row",
          flexGap: CELL_GAP,
          flex: 1,
          paddingVertical: 4,
        }}
      >
        {recentWeeks.map((week, weekIdx) => (
          <FlexWidget
            key={weekIdx}
            style={{ flexDirection: "column", flexGap: CELL_GAP }}
          >
            {week.contributionDays.map((day, dayIdx) => (
              <FlexWidget
                key={dayIdx}
                style={{
                  width: cellSize,
                  height: cellSize,
                  backgroundColor: levelColor(day.contributionLevel, c),
                  borderRadius: Math.max(1, Math.floor(cellSize / 5)),
                }}
              />
            ))}
          </FlexWidget>
        ))}
      </FlexWidget>

      <TextWidget
        text={`${totalContributions.toLocaleString()} contributions this year`}
        style={{ fontSize: 11, fontFamily: "Inter", color: c.muted }}
      />
    </FlexWidget>
  );
}
