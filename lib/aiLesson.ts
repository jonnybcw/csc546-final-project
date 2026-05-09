import { z } from "zod";

import { requestAIJson } from "@/lib/aiClient";
import type { ContextSummary, LessonPlan, ProgressSnapshot } from "@/types/orion";

const AILessonSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  durationMinutes: z.number().int().min(5).max(30),
  difficulty: z.enum(["Beginner", "Elementary", "Intermediate", "Upper Intermediate", "Advanced"]),
  focus: z.string().min(1),
  exercises: z
    .array(
      z.object({
        type: z.enum(["translate", "fill_blank", "vocabulary"]),
        prompt: z.string().min(1),
        answer: z.string().min(1),
        hint: z.string().min(1),
        choices: z.array(z.string().min(1)).min(2).max(5).optional(),
        blankAnswers: z.array(z.string().min(1)).min(1).max(4).optional(),
        blankPlaceholders: z.array(z.string().min(1)).min(1).max(4).optional(),
        sourceTerm: z.string().min(1).optional(),
        matchPairs: z
          .array(z.object({
            source: z.string().min(1),
            target: z.string().min(1)
          }))
          .min(2)
          .max(5)
          .optional()
      })
    )
    .min(3)
    .max(10)
});

export async function generateDailyLessonWithAI(
  summary: ContextSummary,
  progress: ProgressSnapshot,
  targetLanguage = "Spanish"
): Promise<{ lesson: LessonPlan; source: "ai" }> {
  try {
    const result = await requestAIJson(
      [
        {
          role: "system",
          content:
            "You design concise language-learning lessons personalized from user context. Return only valid JSON."
        },
        {
          role: "user",
          content: `Create one daily lesson for an intermediate language learner.
Target language: ${targetLanguage}

Profile summary:
${JSON.stringify(summary)}

Performance snapshot:
${JSON.stringify(progress)}

Return JSON with keys:
- title
- description
- durationMinutes
- difficulty
- focus
- exercises: array of 3-6 items.

Each exercise must include:
- type (translate | fill_blank | vocabulary)
- prompt
- answer
- hint
- choices only for vocabulary exercises.
- blankAnswers only for fill_blank exercises.
- blankPlaceholders only for fill_blank exercises.
- sourceTerm only for vocabulary exercises.
- matchPairs only for vocabulary exercises.

For fill_blank exercises:
- Put one ____ marker in the prompt for each missing word or phrase.
- Include blankAnswers as an array in the same order as the blanks.
- Include blankPlaceholders as English/source-language hints in the same order as the blanks.
- Set answer to the blankAnswers joined by " | ".
- Do not leave visible missing words in the prompt.

For vocabulary exercises:
- Make the prompt a clear matching instruction, like: Match each English meaning to the ${targetLanguage} word.
- Include matchPairs as an array of 2-4 objects with source as the English/source term and target as the ${targetLanguage} word.
- Include choices as the target words from matchPairs.
- Set answer to matchPairs joined as "source - target | source - target".
- Do not put "a) b) c)" options inside the prompt.`
        }
      ],
      0.4
    );

    if (!result) throw new Error("AI provider not configured");

    const parsed = AILessonSchema.parse(result);
    return {
      source: "ai",
      lesson: {
        ...parsed,
        targetLanguage,
        exercises: parsed.exercises.map((exercise, index) => ({
          id: `ai-ex-${index + 1}`,
          ...exercise
        }))
      }
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown error";
    throw new Error(`AI lesson generation failed: ${message}`);
  }
}
