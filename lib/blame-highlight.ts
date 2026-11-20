import type { HighlightRenderNode } from "@tanstack/highlight/core";

import { highlightFileLines } from "@/lib/highlight";
import type { BlameRange } from "@/types/github-graphql.types";

export interface BlameLine {
  lineNumber: number;
  nodes: HighlightRenderNode[];
  range: BlameRange;
  isRangeStart: boolean;
  tint: 0 | 1;
}

export function buildBlameLines(text: string, ranges: BlameRange[], fileName: string): BlameLine[] {
  const rawLines = text.split("\n");
  const maxLine = ranges.reduce((max, range) => Math.max(max, range.endingLine), 0);
  if (rawLines.length === maxLine + 1 && rawLines.at(-1) === "") rawLines.pop();

  const highlighted = highlightFileLines(rawLines, fileName);
  const rangeByLine = new Map<number, BlameRange>();
  for (const range of ranges) {
    for (let line = range.startingLine; line <= range.endingLine; line++) {
      rangeByLine.set(line, range);
    }
  }

  let lastOid: string | null = null;
  let tint: 0 | 1 = 0;
  const result: BlameLine[] = [];
  for (let i = 0; i < rawLines.length; i++) {
    const lineNumber = i + 1;
    const range = rangeByLine.get(lineNumber);
    if (!range) continue;
    const isRangeStart = range.commit.oid !== lastOid;
    if (isRangeStart) {
      tint = tint === 0 ? 1 : 0;
      lastOid = range.commit.oid;
    }
    result.push({ lineNumber, nodes: highlighted[i] ?? [], range, isRangeStart, tint });
  }
  return result;
}
