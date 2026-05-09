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
        hint: z.string().optional(),
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

function normalizeVocabularyTerm(value: string): string {
  return value.trim().toLowerCase();
}

function countNewVocabularyPairs(lesson: LessonPlan, summary: ContextSummary): number {
  const existingVocabularyTerms = new Set(
    summary.vocabulary.flatMap((pair) => [
      normalizeVocabularyTerm(pair.source),
      normalizeVocabularyTerm(pair.target)
    ])
  );
  const newVocabularyTerms = new Set<string>();

  lesson.exercises
    .filter((exercise) => exercise.type === "vocabulary")
    .flatMap((exercise) => exercise.matchPairs ?? [])
    .forEach((pair) => {
      const source = normalizeVocabularyTerm(pair.source);
      const target = normalizeVocabularyTerm(pair.target);
      if (
        !source ||
        !target ||
        existingVocabularyTerms.has(source) ||
        existingVocabularyTerms.has(target) ||
        newVocabularyTerms.has(source) ||
        newVocabularyTerms.has(target)
      ) {
        return;
      }

      newVocabularyTerms.add(source);
      newVocabularyTerms.add(target);
    });

  return newVocabularyTerms.size / 2;
}

function validateAINewVocabulary(lesson: LessonPlan, summary: ContextSummary): void {
  const vocabularyExercises = lesson.exercises.filter((exercise) => exercise.type === "vocabulary");
  if (vocabularyExercises.length === 0) {
    throw new Error("AI lesson must include a vocabulary exercise");
  }

  if (vocabularyExercises.some((exercise) => !exercise.matchPairs || exercise.matchPairs.length < 2)) {
    throw new Error("AI vocabulary exercise must include matchPairs");
  }

  if (countNewVocabularyPairs(lesson, summary) < 2) {
    throw new Error("AI lesson must introduce at least 2 new vocabulary terms");
  }
}

function getDefaultHint(exerciseType: LessonPlan["exercises"][number]["type"], targetLanguage: string): string {
  if (exerciseType === "translate") {
    return `Focus on meaning and natural word order in ${targetLanguage}.`;
  }
  if (exerciseType === "fill_blank") {
    return "Use the surrounding sentence context to choose the missing word or phrase.";
  }
  return `Match the English meaning with the ${targetLanguage} term.`;
}

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
          content: `Create one daily lesson for a ${summary.level} language learner.
Target language: ${targetLanguage}

Profile summary:
${JSON.stringify(summary)}

Performance snapshot:
${JSON.stringify(progress)}

Return JSON with keys:
- title: an English title for the learner, not translated into ${targetLanguage}
- description: an English description for the learner, not translated into ${targetLanguage}
- durationMinutes
- difficulty: must exactly equal the detected level "${summary.level}"
- focus
- exercises: array of 3-6 items.

Lesson difficulty:
- Set difficulty to exactly "${summary.level}".
- Do not make difficulty easier or harder based on performance, streak, or lesson content.
- Use the performance snapshot only to tune exercise style within that detected level.

Lesson metadata language:
- Write title and description in English, because that is the learner's fluent interface language.
- Do not write the title or description in ${targetLanguage}; reserve ${targetLanguage} for the learning content inside exercises.

Lesson vocabulary requirement:
- Include at least one vocabulary exercise.
- The vocabulary exercise must include at least 2 brand-new vocabulary items chosen by you from the user's interests, themes, and sample sentences.
- Use the provided vocabulary list only as examples/context; do not limit yourself to it.
- A brand-new item means neither its source term nor target term appears in the provided vocabulary list.

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
- Choose matchPairs yourself based on interests/themes/sample sentences; do not copy only from the provided vocabulary list.
- At least 2 matchPairs must be new interest-based vocabulary items.
- Include choices as the target words from matchPairs.
- Set answer to matchPairs joined as "source - target | source - target".
- Do not put "a) b) c)" options inside the prompt.`
        }
      ],
      0.4
    );

    if (!result) throw new Error("AI provider not configured");

    const parsed = AILessonSchema.parse(result);
    const lesson: LessonPlan = {
      ...parsed,
      difficulty: summary.level,
      targetLanguage,
      exercises: parsed.exercises.map((exercise, index) => ({
        id: `ai-ex-${index + 1}`,
        ...exercise,
        hint: exercise.hint?.trim() || getDefaultHint(exercise.type, targetLanguage)
      }))
    };
    validateAINewVocabulary(lesson, summary);

    return {
      source: "ai",
      lesson
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown error";
    throw new Error(`AI lesson generation failed: ${message}`);
  }
}
