import { describe, expect, it } from "vitest";

import { evaluateAnswer, generateLessonPlan, updateProgressAfterExercise } from "../lib/lessonEngine";
import type { ContextSummary, ProgressSnapshot } from "../types/orion";

const SUMMARY: ContextSummary = {
  interests: ["Coding", "Travel"],
  themes: [
    { name: "Work & Projects", percentage: 34 },
    { name: "Daily Life", percentage: 18 }
  ],
  vocabulary: [{ source: "deploy", target: "desplegar" }],
  sampleSentences: ["I finished my coding project late last night."],
  vocabularyFrequency: { deploy: 2, project: 1 },
  level: "Intermediate",
  totalEntries: 3
};

const PROGRESS: ProgressSnapshot = {
  streakDays: 12,
  weeklyGoalCompletion: 72,
  wordsLearned: 100,
  timeLearnedMinutes: 200,
  accuracyRate: 84,
  completedDays: [1, 2, 3]
};

describe("lessonEngine", () => {
  it("generates a lesson plan with exercises", () => {
    const plan = generateLessonPlan(SUMMARY, PROGRESS);
    expect(plan.exercises).toHaveLength(3);
    expect(plan.title).toContain("Coding");
  });

  it("evaluates answers with punctuation normalization", () => {
    expect(
      evaluateAnswer("Termine mi proyecto de programacion tarde anoche.", "Termine mi proyecto de programacion tarde anoche")
    ).toBe(true);
  });

  it("updates progress after exercise submission", () => {
    const updated = updateProgressAfterExercise(PROGRESS, true);
    expect(updated.wordsLearned).toBeGreaterThan(PROGRESS.wordsLearned);
    expect(updated.accuracyRate).toBeGreaterThan(PROGRESS.accuracyRate);
  });
});
