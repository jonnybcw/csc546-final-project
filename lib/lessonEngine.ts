import type { ContextSummary, LessonExercise, LessonPlan, ProgressSnapshot } from "@/types/orion";

const DEFAULT_SENTENCE = "I finished my coding project late last night.";
const FALLBACK_TRANSLATE_ANSWER_BY_LANGUAGE: Record<string, string> = {
  Spanish: "Termine mi proyecto de programacion tarde anoche.",
  French: "J ai termine mon projet de codage tard hier soir.",
  German: "Ich habe mein coding projekt gestern abend spaet abgeschlossen.",
  Portuguese: "Terminei meu projeto de programacao tarde ontem a noite.",
  Italian: "Ho finito il mio progetto di programmazione tardi ieri sera.",
  Japanese: "昨夜遅くにコーディングプロジェクトを終えました。"
};
const FALLBACK_VOCAB_CHOICES_BY_LANGUAGE: Record<string, string[]> = {
  Spanish: ["progreso", "rutina", "fluidez"],
  French: ["progres", "routine", "fluidite"],
  German: ["fortschritt", "routine", "flussigkeit"],
  Portuguese: ["progresso", "rotina", "fluencia"],
  Italian: ["progresso", "routine", "fluidita"],
  Japanese: ["進歩", "日課", "流暢さ"]
};
const FALLBACK_VOCAB_PAIR_BY_LANGUAGE: Record<string, { source: string; target: string }[]> = {
  Spanish: [
    { source: "progress", target: "progreso" },
    { source: "routine", target: "rutina" },
    { source: "fluency", target: "fluidez" }
  ],
  French: [
    { source: "progress", target: "progres" },
    { source: "routine", target: "routine" },
    { source: "fluency", target: "fluidite" }
  ],
  German: [
    { source: "progress", target: "fortschritt" },
    { source: "routine", target: "routine" },
    { source: "fluency", target: "flussigkeit" }
  ],
  Portuguese: [
    { source: "progress", target: "progresso" },
    { source: "routine", target: "rotina" },
    { source: "fluency", target: "fluencia" }
  ],
  Italian: [
    { source: "progress", target: "progresso" },
    { source: "routine", target: "routine" },
    { source: "fluency", target: "fluidita" }
  ],
  Japanese: [
    { source: "progress", target: "進歩" },
    { source: "routine", target: "日課" },
    { source: "fluency", target: "流暢さ" }
  ]
};
function titleFromInterests(interests: string[]): string {
  if (interests.length === 0) return "Daily Personalized Practice";
  return `${interests[0]} Conversation`;
}

function buildTranslateExercise(sentence: string, targetLanguage: string): LessonExercise {
  return {
    id: "ex-translate",
    type: "translate",
    prompt: sentence,
    answer:
      FALLBACK_TRANSLATE_ANSWER_BY_LANGUAGE[targetLanguage] ??
      FALLBACK_TRANSLATE_ANSWER_BY_LANGUAGE.Spanish,
    hint: `Pay attention to verb tense and time expressions in ${targetLanguage}.`
  };
}

function buildFillBlankExercise(summary: ContextSummary, targetLanguage: string): LessonExercise {
  const focusWord = summary.vocabulary[0]?.source ?? "routine";
  return {
    id: "ex-fill",
    type: "fill_blank",
    prompt: `Complete the sentence in ${targetLanguage}: "I keep a consistent ____ to improve my language skills."`,
    answer: focusWord,
    blankAnswers: [focusWord],
    blankPlaceholders: [focusWord],
    hint: "Use the same word you practiced in your vocabulary set."
  };
}

function buildVocabularyExercise(summary: ContextSummary, targetLanguage: string): LessonExercise {
  const vocab = summary.vocabulary[0] ?? { source: "progress", target: "progreso" };
  const fallbackPairs = FALLBACK_VOCAB_PAIR_BY_LANGUAGE[targetLanguage] ?? FALLBACK_VOCAB_PAIR_BY_LANGUAGE.Spanish;
  const matchPairs = [vocab, ...summary.vocabulary, ...fallbackPairs]
    .filter((pair, index, allPairs) => allPairs.findIndex((item) => item.source === pair.source || item.target === pair.target) === index)
    .slice(0, 3);
  const fallbackChoices = FALLBACK_VOCAB_CHOICES_BY_LANGUAGE[targetLanguage] ?? FALLBACK_VOCAB_CHOICES_BY_LANGUAGE.Spanish;
  const choices = [...matchPairs.map((pair) => pair.target), ...fallbackChoices]
    .filter((choice, index, allChoices) => allChoices.indexOf(choice) === index)
    .slice(0, 3);

  return {
    id: "ex-vocab",
    type: "vocabulary",
    prompt: `Match each English meaning to the ${targetLanguage} word.`,
    answer: matchPairs.map((pair) => `${pair.source} - ${pair.target}`).join(" | "),
    choices,
    sourceTerm: vocab.source,
    matchPairs,
    hint: "Think about how this word appeared in your context."
  };
}

function normalizeAnswerPart(value: string): string {
  return value.trim().toLowerCase().replace(/[.,!?;:"'()¿¡]/g, "");
}

/** Max single insert/substitute/delete for words at least this long (avoids lax short-word matches). */
const MIN_SINGLE_TYPO_LEN = 6;

function levenshteinDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const row = Array.from({ length: n + 1 }, (_, columnIndex) => columnIndex);
  for (let rowIndex = 1; rowIndex <= m; rowIndex += 1) {
    let diagonal = row[0];
    row[0] = rowIndex;
    for (let columnIndex = 1; columnIndex <= n; columnIndex += 1) {
      const nextDiagonal = row[columnIndex];
      row[columnIndex] = Math.min(
        row[columnIndex - 1] + 1,
        row[columnIndex] + 1,
        diagonal + (a[rowIndex - 1] === b[columnIndex - 1] ? 0 : 1)
      );
      diagonal = nextDiagonal;
    }
  }
  return row[row.length - 1] ?? n;
}

function tokensMatchWithSingleTypoTolerance(normalizedLeft: string, normalizedRight: string): boolean {
  if (normalizedLeft === normalizedRight) return true;
  if (
    normalizedLeft.length < MIN_SINGLE_TYPO_LEN ||
    normalizedRight.length < MIN_SINGLE_TYPO_LEN
  ) {
    return false;
  }
  return levenshteinDistance(normalizedLeft, normalizedRight) <= 1;
}

export function generateLessonPlan(
  summary: ContextSummary,
  _progress: ProgressSnapshot,
  targetLanguage = "Spanish"
): LessonPlan {
  const sentence = summary.sampleSentences[0] ?? DEFAULT_SENTENCE;

  return {
    title: titleFromInterests(summary.interests),
    description: `Practice phrases and structures from your ${summary.interests[0] ?? "daily"} conversations.`,
    durationMinutes: 15,
    difficulty: summary.level,
    exercises: [
      buildTranslateExercise(sentence, targetLanguage),
      buildFillBlankExercise(summary, targetLanguage),
      buildVocabularyExercise(summary, targetLanguage)
    ],
    focus: summary.interests[0] ?? "Personalized Language Practice",
    targetLanguage
  };
}

export function evaluateAnswer(input: string, expected: string): boolean {
  const normalizedInput = normalizeAnswerPart(input);
  const normalizedExpected = normalizeAnswerPart(expected);
  return tokensMatchWithSingleTypoTolerance(normalizedInput, normalizedExpected);
}

export interface AnswerPartFeedback {
  id: string;
  token: string;
  status: "correct" | "incorrect";
}

export function compareAnswerParts(input: string, expected: string): AnswerPartFeedback[] {
  const inputTokens = input.trim().split(/\s+/).filter(Boolean);
  const expectedTokens = expected.trim().split(/\s+/).filter(Boolean);
  const normalizedInput = inputTokens.map(normalizeAnswerPart);
  const normalizedExpected = expectedTokens.map(normalizeAnswerPart);
  const scores = Array.from({ length: inputTokens.length + 1 }, () =>
    Array.from({ length: expectedTokens.length + 1 }, () => 0)
  );

  for (let inputIndex = inputTokens.length - 1; inputIndex >= 0; inputIndex -= 1) {
    for (let expectedIndex = expectedTokens.length - 1; expectedIndex >= 0; expectedIndex -= 1) {
      if (
        normalizedInput[inputIndex] &&
        tokensMatchWithSingleTypoTolerance(
          normalizedInput[inputIndex],
          normalizedExpected[expectedIndex] ?? ""
        )
      ) {
        scores[inputIndex][expectedIndex] = scores[inputIndex + 1][expectedIndex + 1] + 1;
      } else {
        scores[inputIndex][expectedIndex] = Math.max(
          scores[inputIndex + 1][expectedIndex],
          scores[inputIndex][expectedIndex + 1]
        );
      }
    }
  }

  const matchedInputIndexes = new Set<number>();
  let inputIndex = 0;
  let expectedIndex = 0;

  while (inputIndex < inputTokens.length && expectedIndex < expectedTokens.length) {
    if (
      normalizedInput[inputIndex] &&
      tokensMatchWithSingleTypoTolerance(
        normalizedInput[inputIndex],
        normalizedExpected[expectedIndex] ?? ""
      )
    ) {
      matchedInputIndexes.add(inputIndex);
      inputIndex += 1;
      expectedIndex += 1;
    } else if (scores[inputIndex + 1][expectedIndex] >= scores[inputIndex][expectedIndex + 1]) {
      inputIndex += 1;
    } else {
      expectedIndex += 1;
    }
  }

  return inputTokens.map((token, index) => ({
    id: `${index}-${token}`,
    token,
    status: matchedInputIndexes.has(index) ? "correct" : "incorrect"
  }));
}

export function updateProgressAfterExercise(
  progress: ProgressSnapshot,
  correct: boolean
): ProgressSnapshot {
  const accuracyDelta = correct ? 3 : -2;
  const wordsDelta = correct ? 4 : 1;
  const completionDelta = correct ? 8 : 4;

  return {
    ...progress,
    wordsLearned: progress.wordsLearned + wordsDelta,
    weeklyGoalCompletion: Math.min(100, progress.weeklyGoalCompletion + completionDelta),
    accuracyRate: Math.max(10, Math.min(100, progress.accuracyRate + accuracyDelta)),
    timeLearnedMinutes: progress.timeLearnedMinutes + 5
  };
}
