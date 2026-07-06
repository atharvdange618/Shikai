"use no memo";

import React from "react";

import { FlexWidget, TextWidget } from "react-native-android-widget";
import type { WidgetContributionWeek } from "../lib/widget-data";

interface Props {
  totalContributions: number;
  weeks: WidgetContributionWeek[];
  currentStreak: number;
  longestStreak: number;
  widgetWidth?: number;
  widgetHeight?: number;
}

const LIGHT_COLORS: Record<string, `#${string}`> = {
  NONE: "#ebedf0",
  FIRST_QUARTILE: "#9be9a8",
  SECOND_QUARTILE: "#40c463",
  THIRD_QUARTILE: "#30a14e",
  FOURTH_QUARTILE: "#216e39",
};

const DARK_COLORS: Record<string, `#${string}`> = {
  NONE: "#161b22",
  FIRST_QUARTILE: "#0e4429",
  SECOND_QUARTILE: "#006d32",
  THIRD_QUARTILE: "#26a641",
  FOURTH_QUARTILE: "#39d353",
};

function getColors(darkMode: boolean) {
  return darkMode ? DARK_COLORS : LIGHT_COLORS;
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
  widgetWidth = 250,
  widgetHeight = 110,
}: Props) {
  const isDark = false;
  const colors = getColors(isDark);
  const bgColor: `#${string}` = isDark ? "#0d1117" : "#ffffff";
  const textColor: `#${string}` = isDark ? "#e6edf3" : "#1f2328";
  const mutedColor: `#${string}` = isDark ? "#7d8590" : "#656d76";

  const { cellSize, weeksToShow } = calcLayout(widgetWidth, widgetHeight);
  const recentWeeks = weeks.slice(-weeksToShow);

  return (
    <FlexWidget
      style={{
        height: "match_parent",
        width: "match_parent",
        backgroundColor: bgColor,
        borderRadius: 16,
        padding: PADDING,
        justifyContent: "space-between",
      }}
      clickAction="OPEN_APP"
      accessibilityLabel={`GitHub contribution widget. ${currentStreak} day streak. ${totalContributions} contributions this year.`}
    >
      <FlexWidget
        style={{
          flexDirection: "row",
          alignItems: "center",
        }}
      >
        <TextWidget
          text={currentStreak.toString()}
          style={{
            fontSize: 20,
            fontFamily: "Inter",
            fontWeight: "700",
            color: textColor,
          }}
        />
        <FlexWidget
          style={{
            flexDirection: "column",
            marginLeft: 6,
          }}
        >
          <TextWidget
            text="day streak"
            style={{
              fontSize: 11,
              fontFamily: "Inter",
              color: mutedColor,
            }}
          />
          <TextWidget
            text={`best: ${longestStreak}`}
            style={{
              fontSize: 9,
              fontFamily: "Inter",
              color: mutedColor,
            }}
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
            style={{
              flexDirection: "column",
              flexGap: CELL_GAP,
            }}
          >
            {week.contributionDays.map((day, dayIdx) => (
              <FlexWidget
                key={dayIdx}
                style={{
                  width: cellSize,
                  height: cellSize,
                  backgroundColor: colors[day.contributionLevel] ?? colors.NONE,
                  borderRadius: Math.max(1, Math.floor(cellSize / 5)),
                }}
              />
            ))}
          </FlexWidget>
        ))}
      </FlexWidget>

      <TextWidget
        text={`${totalContributions.toLocaleString()} contributions this year`}
        style={{
          fontSize: 11,
          fontFamily: "Inter",
          color: mutedColor,
        }}
      />
    </FlexWidget>
  );
}
