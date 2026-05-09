import { describe, expect, it, vi } from "vitest";

import { requestAIJson } from "@/lib/aiClient";
import { generateDailyLessonWithAI } from "../lib/aiLesson";
import type { ContextSummary, ProgressSnapshot } from "../types/orion";

vi.mock("@/lib/aiClient", () => ({
  requestAIJson: vi.fn()
}));

const SUMMARY: ContextSummary = {
  interests: ["Coding"],
  themes: [{ name: "Work & Projects", percentage: 50 }],
  vocabulary: [{ source: "deploy", target: "desplegar" }],
  sampleSentences: ["I debug code and ship features."],
  vocabularyFrequency: { deploy: 2 },
  level: "Intermediate",
  totalEntries: 1
};

const PROGRESS: ProgressSnapshot = {
  streakDays: 3,
  weeklyGoalCompletion: 60,
  wordsLearned: 40,
  timeLearnedMinutes: 120,
  accuracyRate: 80,
  completedDays: [1, 2],
  lessonActivityDates: []
};

describe("generateDailyLessonWithAI", () => {
  it("fills default hints when the AI omits them", async () => {
    vi.mocked(requestAIJson).mockResolvedValueOnce({
      title: "Coding Practice",
      description: "Practice language around coding work.",
      durationMinutes: 15,
      difficulty: "Advanced",
      focus: "Coding",
      exercises: [
        {
          type: "translate",
          prompt: "I am debugging the feature today.",
          answer: "Estoy depurando la funcionalidad hoy."
        },
        {
          type: "fill_blank",
          prompt: "Complete the sentence in Spanish: Estoy ____ la funcionalidad.",
          answer: "depurando",
          blankAnswers: ["depurando"],
          blankPlaceholders: ["debugging"],
          hint: "Use the action from the coding context."
        },
        {
          type: "vocabulary",
          prompt: "Match each English meaning to the Spanish word.",
          answer: "feature - funcionalidad | bug - error",
          choices: ["funcionalidad", "error"],
          sourceTerm: "feature",
          matchPairs: [
            { source: "feature", target: "funcionalidad" },
            { source: "bug", target: "error" }
          ]
        }
      ]
    });

    const { lesson } = await generateDailyLessonWithAI(SUMMARY, PROGRESS, "Spanish");

    expect(lesson.exercises[0]?.hint).toBe("Focus on meaning and natural word order in Spanish.");
    expect(lesson.exercises[2]?.hint).toBe("Match the English meaning with the Spanish term.");
    expect(lesson.difficulty).toBe(SUMMARY.level);
  });

  it("instructs the AI to keep lesson metadata in English", async () => {
    vi.mocked(requestAIJson).mockResolvedValueOnce({
      title: "Cooking and Travel: From Office to Rome",
      description: "Explore new vocabulary related to cooking and Italian culture.",
      durationMinutes: 15,
      difficulty: "Intermediate",
      focus: "Travel",
      exercises: [
        {
          type: "translate",
          prompt: "I am planning a trip to Rome.",
          answer: "Estoy planeando un viaje a Roma.",
          acceptedAnswers: ["Planeo un viaje a Roma."],
          hint: "Focus on the travel action."
        },
        {
          type: "fill_blank",
          prompt: "Complete the sentence in Spanish: Voy a ____ una reserva.",
          answer: "hacer",
          blankAnswers: ["hacer"],
          blankPlaceholders: ["make"],
          hint: "Use the verb for making a reservation."
        },
        {
          type: "vocabulary",
          prompt: "Match each English meaning to the Spanish word.",
          answer: "reservation - reserva | landmark - punto de referencia",
          choices: ["reserva", "punto de referencia"],
          sourceTerm: "reservation",
          matchPairs: [
            { source: "reservation", target: "reserva" },
            { source: "landmark", target: "punto de referencia" }
          ],
          hint: "Match each travel term."
        }
      ]
    });

    await generateDailyLessonWithAI(SUMMARY, PROGRESS, "Spanish");

    const messages = vi.mocked(requestAIJson).mock.calls[0]?.[0];
    expect(messages?.[1]?.content).toContain("Write title and description in English");
    expect(messages?.[1]?.content).toContain("Do not write the title or description in Spanish");
    expect(messages?.[1]?.content).toContain(`difficulty: must exactly equal the detected level "${SUMMARY.level}"`);
    expect(messages?.[1]?.content).toContain("acceptedAnswers only for translate exercises");
    expect(messages?.[1]?.content).toContain("Include variants with optional subject pronouns");
  });
});
