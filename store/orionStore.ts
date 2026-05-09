"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

import { updateProgressAfterExercise } from "@/lib/lessonEngine";
import { mergeContextSummary } from "@/lib/mergeContext";
import { markLessonActivity, withLessonActivityDates } from "@/lib/progress";
import type { ContextSummary, LessonPlan, ProcessingStep, ProgressSnapshot, TextRecord } from "@/types/orion";

export const ORION_STORE_STORAGE_KEY = "orion-store-v1";

const DEFAULT_STEPS: ProcessingStep[] = [
  {
    id: "upload",
    title: "Uploading file",
    detail: "Sending your file securely to Orion.",
    status: "Pending"
  },
  {
    id: "extract",
    title: "Extracting conversations",
    detail: "Reading and organizing your data.",
    status: "In progress"
  },
  {
    id: "topics",
    title: "Identifying topics & themes",
    detail: "Finding the main topics you talk about.",
    status: "Pending"
  },
  {
    id: "vocab",
    title: "Analyzing vocabulary & level",
    detail: "Evaluating vocabulary, complexity, and language level.",
    status: "Pending"
  },
  {
    id: "profile",
    title: "Building your lesson profile",
    detail: "Creating a personalized learning profile just for you.",
    status: "Pending"
  }
];

const DEFAULT_PROGRESS: ProgressSnapshot = {
  streakDays: 0,
  weeklyGoalCompletion: 72,
  wordsLearned: 158,
  timeLearnedMinutes: 1475,
  accuracyRate: 84,
  completedDays: [1, 2, 3, 4, 5],
  lessonActivityDates: []
};

function normalizeProgress(progress: Partial<ProgressSnapshot> | undefined): ProgressSnapshot {
  const mergedProgress = {
    ...DEFAULT_PROGRESS,
    ...progress
  };

  return withLessonActivityDates(mergedProgress, mergedProgress.lessonActivityDates);
}

interface OrionState {
  records: TextRecord[];
  summary: ContextSummary | null;
  lesson: LessonPlan | null;
  progress: ProgressSnapshot;
  processingSteps: ProcessingStep[];
  extractionSource: "ai" | null;
  lessonSource: "ai" | null;
  extractionError: string | null;
  lessonError: string | null;
  pendingUploadFile: File | null;
  uploadInProgress: boolean;
  uploadStarted: boolean;
  uploadError: string | null;
  targetLanguage: string | null;
  userFullName: string | null;
  lastUploadedFileName: string | null;
  setTargetLanguage: (language: string) => void;
  setUserFullName: (name: string | null) => void;
  setSummary: (summary: ContextSummary) => void;
  setProgress: (progress: ProgressSnapshot) => void;
  setPendingUploadFile: (file: File | null) => void;
  setUploadInProgress: (value: boolean) => void;
  setUploadStarted: (value: boolean) => void;
  setUploadError: (message: string | null) => void;
  setUploadResult: (
    fileName: string,
    records: TextRecord[],
    summary: ContextSummary,
    source: "ai"
  ) => void;
  setProcessingStepStatus: (id: string, status: ProcessingStep["status"]) => void;
  addInterest: (interest: string) => void;
  removeInterest: (interest: string) => void;
  setLevel: (level: ContextSummary["level"]) => void;
  setLesson: (lesson: LessonPlan, source: "ai") => void;
  setLessonError: (message: string | null) => void;
  submitExerciseResult: (correct: boolean) => void;
  completeLesson: () => void;
  resetOnboarding: () => void;
  /** Replace context/lesson from Supabase so the account owns data across browsers. */
  bootstrapFromServer: (payload: {
    records: TextRecord[];
    summary: ContextSummary;
    lesson: LessonPlan | null;
    targetLanguage: string | null;
    userFullName?: string | null;
    progress?: ProgressSnapshot;
  }) => void;
}

export const useOrionStore = create<OrionState>()(
  persist(
    (set) => ({
      records: [],
      summary: null,
      lesson: null,
      progress: DEFAULT_PROGRESS,
      processingSteps: DEFAULT_STEPS,
      extractionSource: null,
      lessonSource: null,
      extractionError: null,
      lessonError: null,
      pendingUploadFile: null,
      uploadInProgress: false,
      uploadStarted: false,
      uploadError: null,
      targetLanguage: null,
      userFullName: null,
      lastUploadedFileName: null,
      setTargetLanguage: (language) =>
        set(() => ({
          targetLanguage: language.trim() || null
        })),
      setUserFullName: (name) =>
        set(() => ({
          userFullName: name?.trim() || null
        })),
      setSummary: (summary) =>
        set(() => ({
          summary
        })),
      setProgress: (progress) =>
        set(() => ({
          progress: normalizeProgress(progress)
        })),
      setPendingUploadFile: (file) =>
        set(() => ({
          pendingUploadFile: file
        })),
      setUploadInProgress: (value) =>
        set(() => ({
          uploadInProgress: value
        })),
      setUploadStarted: (value) =>
        set(() => ({
          uploadStarted: value
        })),
      setUploadError: (message) =>
        set(() => ({
          uploadError: message
        })),
      setUploadResult: (fileName, records, summary, source) =>
        set((state) => {
          const mergedSummary = mergeContextSummary(state.summary, summary);
          return {
            lastUploadedFileName: fileName,
            records: [...state.records, ...records].slice(-2000),
            summary: mergedSummary,
            processingSteps: DEFAULT_STEPS,
            extractionSource: source,
            extractionError: null,
            pendingUploadFile: null,
            uploadStarted: false,
            uploadError: null,
            lesson: null
          };
        }),
      setProcessingStepStatus: (id, status) =>
        set((state) => ({
          processingSteps: state.processingSteps.map((step) =>
            step.id === id ? { ...step, status } : step
          )
        })),
      addInterest: (interest) =>
        set((state) => {
          if (!state.summary || state.summary.interests.includes(interest)) return state;
          return {
            summary: {
              ...state.summary,
              interests: [...state.summary.interests, interest]
            }
          };
        }),
      removeInterest: (interest) =>
        set((state) => {
          if (!state.summary) return state;
          return {
            summary: {
              ...state.summary,
              interests: state.summary.interests.filter((item) => item !== interest)
            }
          };
        }),
      setLevel: (level) =>
        set((state) => {
          if (!state.summary) return state;
          return {
            summary: {
              ...state.summary,
              level
            }
          };
        }),
      setLesson: (lesson, source) =>
        set(() => ({
          lesson,
          lessonSource: source,
          lessonError: null
        })),
      setLessonError: (message) =>
        set(() => ({
          lessonError: message
        })),
      submitExerciseResult: (correct) =>
        set((state) => ({
          progress: updateProgressAfterExercise(state.progress, correct)
        })),
      completeLesson: () =>
        set((state) => ({
          progress: markLessonActivity(state.progress)
        })),
      resetOnboarding: () =>
        set(() => ({
          processingSteps: DEFAULT_STEPS,
          extractionSource: null,
          lessonSource: null,
          extractionError: null,
          lessonError: null,
          pendingUploadFile: null,
          uploadInProgress: false,
          uploadStarted: false,
          uploadError: null,
          lesson: null
        })),
      bootstrapFromServer: (payload) =>
        set((state) => ({
          records: payload.records,
          summary: payload.summary,
          lesson: payload.lesson,
          progress: payload.progress ? normalizeProgress(payload.progress) : state.progress,
          extractionSource: payload.summary ? "ai" : null,
          lessonSource: payload.lesson ? "ai" : null,
          extractionError: null,
          lessonError: null,
          targetLanguage: payload.targetLanguage,
          userFullName:
            payload.userFullName === undefined ? state.userFullName : payload.userFullName?.trim() || null,
          lastUploadedFileName: null,
          uploadInProgress: false,
          uploadStarted: false,
          uploadError: null,
          pendingUploadFile: null
        }))
    }),
    {
      name: ORION_STORE_STORAGE_KEY,
      merge: (persistedState, currentState) => {
        const state = persistedState as Partial<OrionState> | undefined;

        return {
          ...currentState,
          ...state,
          progress: normalizeProgress(state?.progress)
        };
      },
      partialize: (state) => ({
        records: state.records,
        summary: state.summary,
        lesson: state.lesson,
        extractionSource: state.extractionSource,
        lessonSource: state.lessonSource,
        extractionError: state.extractionError,
        lessonError: state.lessonError,
        progress: state.progress,
        targetLanguage: state.targetLanguage,
        userFullName: state.userFullName,
        lastUploadedFileName: state.lastUploadedFileName
      })
    }
  )
);

/** Wait for persisted Orion state to load (needed after auth before reading summary/lesson). */
export async function waitForOrionStoreHydration(): Promise<void> {
  if (typeof window === "undefined") return;
  if (useOrionStore.persist.hasHydrated()) return;
  await Promise.race([
    new Promise<void>((resolve) => {
      const unsubscribe = useOrionStore.persist.onFinishHydration(() => {
        unsubscribe();
        resolve();
      });
    }),
    new Promise<void>((resolve) => setTimeout(resolve, 3000))
  ]);
}

/**
 * When `next` is language onboarding, redirect to home only if the user already has
 * context and a lesson (from local persist or after {@link syncOrionStateFromSupabase} on login).
 */
export function getPostLoginDestination(requestedPath: string): string {
  const pathOnly = requestedPath.split(/[?#]/)[0] || requestedPath;
  if (pathOnly !== "/language") return requestedPath;
  const { summary, lesson } = useOrionStore.getState();
  if (summary && lesson) return "/home";
  return requestedPath;
}
