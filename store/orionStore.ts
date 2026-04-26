"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

import { generateLessonPlan, updateProgressAfterExercise } from "@/lib/lessonEngine";
import { mergeContextSummary } from "@/lib/mergeContext";
import type { ContextSummary, LessonPlan, ProcessingStep, ProgressSnapshot, TextRecord } from "@/types/orion";

const DEFAULT_STEPS: ProcessingStep[] = [
  {
    id: "upload",
    title: "Upload complete",
    detail: "Your file has been received.",
    status: "Completed"
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
  streakDays: 12,
  weeklyGoalCompletion: 72,
  wordsLearned: 158,
  timeLearnedMinutes: 1475,
  accuracyRate: 84,
  completedDays: [1, 2, 3, 4, 5]
};

interface OrionState {
  records: TextRecord[];
  summary: ContextSummary | null;
  lesson: LessonPlan | null;
  progress: ProgressSnapshot;
  processingSteps: ProcessingStep[];
  lastUploadedFileName: string | null;
  setUploadResult: (fileName: string, records: TextRecord[], summary: ContextSummary) => void;
  setProcessingStepStatus: (id: string, status: ProcessingStep["status"]) => void;
  addInterest: (interest: string) => void;
  removeInterest: (interest: string) => void;
  setLevel: (level: ContextSummary["level"]) => void;
  generateLesson: () => void;
  submitExerciseResult: (correct: boolean) => void;
  resetOnboarding: () => void;
}

export const useOrionStore = create<OrionState>()(
  persist(
    (set) => ({
      records: [],
      summary: null,
      lesson: null,
      progress: DEFAULT_PROGRESS,
      processingSteps: DEFAULT_STEPS,
      lastUploadedFileName: null,
      setUploadResult: (fileName, records, summary) =>
        set((state) => {
          const mergedSummary = mergeContextSummary(state.summary, summary);
          return {
            lastUploadedFileName: fileName,
            records: [...state.records, ...records].slice(-2000),
            summary: mergedSummary,
            processingSteps: DEFAULT_STEPS,
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
      generateLesson: () =>
        set((state) => {
          if (!state.summary) return state;
          return {
            lesson: generateLessonPlan(state.summary, state.progress)
          };
        }),
      submitExerciseResult: (correct) =>
        set((state) => ({
          progress: updateProgressAfterExercise(state.progress, correct)
        })),
      resetOnboarding: () =>
        set(() => ({
          processingSteps: DEFAULT_STEPS,
          lesson: null
        }))
    }),
    {
      name: "orion-store-v1",
      partialize: (state) => ({
        records: state.records,
        summary: state.summary,
        lesson: state.lesson,
        progress: state.progress,
        lastUploadedFileName: state.lastUploadedFileName
      })
    }
  )
);
