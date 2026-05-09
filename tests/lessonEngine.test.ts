import { describe, expect, it } from "vitest";

import {
  compareAnswerParts,
  evaluateAnswer,
  generateLessonPlan,
  updateProgressAfterExercise
} from "../lib/lessonEngine";
import { calculateStreakDays, getLocalDateKey, markLessonActivity } from "../lib/progress";
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
  completedDays: [1, 2, 3],
  lessonActivityDates: []
};

describe("lessonEngine", () => {
  it("generates a lesson plan with exercises", () => {
    const plan = generateLessonPlan(SUMMARY, PROGRESS);
    expect(plan.exercises).toHaveLength(3);
    expect(plan.title).toContain("Coding");
    expect(plan.difficulty).toBe(SUMMARY.level);
  });

  it("generates vocabulary exercises with selectable choices", () => {
    const plan = generateLessonPlan(SUMMARY, PROGRESS);
    const vocabularyExercise = plan.exercises.find((exercise) => exercise.type === "vocabulary");

    expect(vocabularyExercise?.prompt).toBe("Match each English meaning to the Spanish word.");
    expect(vocabularyExercise?.matchPairs).toContainEqual({ source: "deploy", target: "desplegar" });
    expect(vocabularyExercise?.choices).toContain("desplegar");
  });

  it("generates fill-blank exercises with a blank instead of the answer", () => {
    const plan = generateLessonPlan(SUMMARY, PROGRESS);
    const fillBlankExercise = plan.exercises.find((exercise) => exercise.type === "fill_blank");

    expect(fillBlankExercise?.prompt).toContain("____");
    expect(fillBlankExercise?.prompt).not.toContain(fillBlankExercise?.answer);
  });

  it("evaluates answers with punctuation normalization", () => {
    expect(
      evaluateAnswer("Termine mi proyecto de programacion tarde anoche.", "Termine mi proyecto de programacion tarde anoche")
    ).toBe(true);
  });

  it("accepts a single typo for longer words", () => {
    expect(evaluateAnswer("projecto", "proyecto")).toBe(true);
  });

  it("still rejects answers that differ by more than one edit for long words", () => {
    expect(evaluateAnswer("completelydifferentword", "proyecto")).toBe(false);
  });

  it("marks matching and incorrect answer parts", () => {
    expect(compareAnswerParts("Termine proyecto tarde ayer", "Termine mi proyecto tarde anoche")).toEqual([
      { id: "0-Termine", token: "Termine", status: "correct" },
      { id: "1-proyecto", token: "proyecto", status: "correct" },
      { id: "2-tarde", token: "tarde", status: "correct" },
      { id: "3-ayer", token: "ayer", status: "incorrect" }
    ]);
  });

  it("updates progress after exercise submission", () => {
    const updated = updateProgressAfterExercise(PROGRESS, true);
    expect(updated.wordsLearned).toBeGreaterThan(PROGRESS.wordsLearned);
    expect(updated.accuracyRate).toBeGreaterThan(PROGRESS.accuracyRate);
    expect(updated.lessonActivityDates).toEqual(PROGRESS.lessonActivityDates);
    expect(updated.streakDays).toBe(PROGRESS.streakDays);
  });

  it("marks streak activity only when a lesson is completed", () => {
    const updated = markLessonActivity(PROGRESS);
    expect(updated.lessonActivityDates).toContain(getLocalDateKey());
    expect(updated.streakDays).toBe(1);
  });

  it("calculates a streak from consecutive lesson activity days", () => {
    expect(calculateStreakDays(["2026-05-05", "2026-05-06", "2026-05-07"], "2026-05-08")).toBe(3);
    expect(calculateStreakDays(["2026-05-05", "2026-05-07"], "2026-05-08")).toBe(1);
    expect(calculateStreakDays(["2026-05-05", "2026-05-06"], "2026-05-08")).toBe(0);
  });
});
