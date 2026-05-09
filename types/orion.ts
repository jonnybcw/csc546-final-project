export type SupportedFileType = "json" | "csv";
export type ProficiencyLevel =
  | "Beginner"
  | "Elementary"
  | "Intermediate"
  | "Upper Intermediate"
  | "Advanced";

export type ProcessingStatus = "Completed" | "In progress" | "Pending";

export interface TextRecord {
  id: string;
  text: string;
  source: string;
  createdAt?: string;
}

export interface TopicScore {
  name: string;
  percentage: number;
}

export interface VocabularyPair {
  source: string;
  target: string;
}

export interface ContextSummary {
  interests: string[];
  themes: TopicScore[];
  vocabulary: VocabularyPair[];
  sampleSentences: string[];
  vocabularyFrequency: Record<string, number>;
  level: ProficiencyLevel;
  totalEntries: number;
}

export interface ProcessingStep {
  id: string;
  title: string;
  detail: string;
  status: ProcessingStatus;
}

export interface UploadApiResponse {
  summary: ContextSummary;
  records: TextRecord[];
  source: "ai";
}

export type LessonExerciseType = "translate" | "fill_blank" | "vocabulary";

export interface LessonExercise {
  id: string;
  type: LessonExerciseType;
  prompt: string;
  answer: string;
  hint: string;
  acceptedAnswers?: string[];
  choices?: string[];
  blankAnswers?: string[];
  blankPlaceholders?: string[];
  sourceTerm?: string;
  matchPairs?: VocabularyPair[];
}

export interface LessonPlan {
  title: string;
  description: string;
  durationMinutes: number;
  difficulty: ProficiencyLevel;
  exercises: LessonExercise[];
  focus: string;
  targetLanguage: string;
}

export interface LessonGenerationResponse {
  lesson: LessonPlan;
  source: "ai";
}

export interface ProgressSnapshot {
  streakDays: number;
  weeklyGoalCompletion: number;
  wordsLearned: number;
  timeLearnedMinutes: number;
  accuracyRate: number;
  completedDays: number[];
  lessonActivityDates: string[];
}
