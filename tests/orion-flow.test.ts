import { describe, expect, it } from "vitest";

import { analyzeContext } from "../lib/analyzeContext";
import { generateLessonPlan } from "../lib/lessonEngine";
import { mergeContextSummary } from "../lib/mergeContext";
import { parseContextPayload } from "../lib/parsers";

describe("orion flow", () => {
  it("supports upload to lesson generation end-to-end", () => {
    const upload = parseContextPayload({
      fileName: "data.json",
      rawContent: JSON.stringify([
        { text: "I write software and debug code daily." },
        { text: "I plan travel routes and practice language." }
      ])
    });

    const summary = analyzeContext(upload.records);
    const merged = mergeContextSummary(summary, summary);
    const lesson = generateLessonPlan(merged, {
      streakDays: 12,
      weeklyGoalCompletion: 70,
      wordsLearned: 140,
      timeLearnedMinutes: 320,
      accuracyRate: 84,
      completedDays: [1, 2, 3, 4, 5]
    });

    expect(summary.totalEntries).toBe(2);
    expect(merged.totalEntries).toBe(4);
    expect(lesson.exercises.length).toBeGreaterThan(0);
  });
});
