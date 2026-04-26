import type { ContextSummary, LessonExercise, LessonPlan, ProgressSnapshot } from "@/types/orion";

const DEFAULT_SENTENCE = "I finished my coding project late last night.";

function titleFromInterests(interests: string[]): string {
  if (interests.length === 0) return "Daily Personalized Practice";
  return `${interests[0]} Conversation`;
}

function buildTranslateExercise(sentence: string): LessonExercise {
  return {
    id: "ex-translate",
    type: "translate",
    prompt: sentence,
    answer: "Termine mi proyecto de programacion tarde anoche.",
    hint: "Pay attention to verb tense and time expressions."
  };
}

function buildFillBlankExercise(summary: ContextSummary): LessonExercise {
  const focusWord = summary.vocabulary[0]?.source ?? "routine";
  return {
    id: "ex-fill",
    type: "fill_blank",
    prompt: `Complete the sentence: "I keep a consistent ${focusWord} to improve my language skills."`,
    answer: focusWord,
    hint: "Use the same word you practiced in your vocabulary set."
  };
}

function buildVocabularyExercise(summary: ContextSummary): LessonExercise {
  const vocab = summary.vocabulary[0] ?? { source: "progress", target: "progreso" };
  return {
    id: "ex-vocab",
    type: "vocabulary",
    prompt: `Translate this word: ${vocab.source}`,
    answer: vocab.target,
    hint: "Think about how this word appeared in your context."
  };
}

export function generateLessonPlan(summary: ContextSummary, progress: ProgressSnapshot): LessonPlan {
  const sentence = summary.sampleSentences[0] ?? DEFAULT_SENTENCE;
  const difficultyBoost = progress.accuracyRate > 80 ? "Upper Intermediate" : summary.level;

  return {
    title: titleFromInterests(summary.interests),
    description: `Practice phrases and structures from your ${summary.interests[0] ?? "daily"} conversations.`,
    durationMinutes: 15,
    difficulty: difficultyBoost as LessonPlan["difficulty"],
    exercises: [buildTranslateExercise(sentence), buildFillBlankExercise(summary), buildVocabularyExercise(summary)],
    focus: summary.interests[0] ?? "Personalized Language Practice"
  };
}

export function evaluateAnswer(input: string, expected: string): boolean {
  const normalizedInput = input.trim().toLowerCase().replace(/[.,!?]/g, "");
  const normalizedExpected = expected.trim().toLowerCase().replace(/[.,!?]/g, "");
  return normalizedInput === normalizedExpected;
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
