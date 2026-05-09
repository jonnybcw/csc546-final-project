"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { useRouter } from "next/navigation";

import { OrionLogo } from "@/components/orion/orion-logo";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import {
  compareAnswerParts,
  evaluateAcceptedAnswers,
  evaluateAnswer,
  getAcceptedTranslateAnswers,
  getClosestExpectedAnswer
} from "@/lib/lessonEngine";
import { LESSON_COMPLETION_EVENT_ID } from "@/lib/progress";
import { useOrionStore } from "@/store/orionStore";
import type { LessonExercise, VocabularyPair } from "@/types/orion";

const BLANK_PATTERN = /_{3,}|\[blank\]|\{\{blank\}\}/gi;

function getFillBlankPromptSegments(prompt: string, answer: string): string[] {
  const displayPrompt = prompt
    .replace(/^Complete the sentence in [^:]+:\s*/i, "")
    .replace(/^["']|["']$/g, "");
  const segments = displayPrompt.split(BLANK_PATTERN);
  if (segments.length > 1) return segments;

  // Backfill older lessons where the generated prompt accidentally included the answer.
  const answerIndex = displayPrompt.toLowerCase().indexOf(answer.toLowerCase());
  if (answerIndex >= 0) {
    return [
      displayPrompt.slice(0, answerIndex),
      displayPrompt.slice(answerIndex + answer.length)
    ];
  }

  return [`${displayPrompt} `, ""];
}

function inferFillBlankAnswersFromCompletedSentence(segments: string[], completedSentence: string): string[] {
  const answers: string[] = [];
  const lowerCompletedSentence = completedSentence.toLowerCase();
  let cursor = 0;

  for (let index = 0; index < segments.length - 1; index += 1) {
    const currentSegment = segments[index] ?? "";
    const nextSegment = segments[index + 1] ?? "";
    const currentSegmentIndex = currentSegment
      ? lowerCompletedSentence.indexOf(currentSegment.toLowerCase(), cursor)
      : cursor;
    if (currentSegmentIndex < 0) return [];

    const answerStart = currentSegmentIndex + currentSegment.length;
    const nextSegmentIndex = nextSegment
      ? lowerCompletedSentence.indexOf(nextSegment.toLowerCase(), answerStart)
      : completedSentence.length;
    if (nextSegmentIndex < 0) return [];

    answers.push(completedSentence.slice(answerStart, nextSegmentIndex).trim());
    cursor = nextSegmentIndex;
  }

  return answers.filter(Boolean);
}

function getFillBlankAnswers(exercise: LessonExercise, segments: string[]): string[] {
  const blankCount = Math.max(1, segments.length - 1);
  const structuredAnswers = exercise.blankAnswers?.filter(Boolean) ?? [];
  if (structuredAnswers.length > 0) return structuredAnswers;

  const delimiters = blankCount > 1 ? /\s*(?:\||;|,)\s*/ : /\s*(?:\||;)\s*/;
  const parsedAnswers = exercise.answer.split(delimiters).map((answer) => answer.trim()).filter(Boolean);
  if (parsedAnswers.length === blankCount) return parsedAnswers;

  const inferredAnswers = inferFillBlankAnswersFromCompletedSentence(segments, exercise.answer);
  if (inferredAnswers.length === blankCount) return inferredAnswers;

  return [exercise.answer];
}

function getQuotedHintTerms(hint: string): string[] {
  return [...hint.matchAll(/['"]([^'"]+)['"]/g)]
    .map((match) => match[1]?.trim())
    .filter((term): term is string => Boolean(term));
}

function getFillBlankPlaceholders(
  exercise: LessonExercise,
  answers: string[],
  vocabulary: VocabularyPair[]
): string[] {
  const structuredPlaceholders = exercise.blankPlaceholders?.filter(Boolean) ?? [];
  if (structuredPlaceholders.length > 0) return structuredPlaceholders;

  const hintTerms = getQuotedHintTerms(exercise.hint);
  if (hintTerms.length >= answers.length) return hintTerms.slice(0, answers.length);

  return answers.map((answer) => {
    const vocabularyMatch = vocabulary.find((pair) => evaluateAnswer(pair.target, answer));
    return vocabularyMatch?.source ?? answer;
  });
}

function getCompletedFillBlankAnswer(segments: string[], answers: string[], fallbackAnswer: string): string {
  if (answers.length !== segments.length - 1) return fallbackAnswer;

  return segments.reduce((result, segment, index) => {
    const answer = answers[index] ? `${answers[index]}` : "";
    return `${result}${segment}${answer}`;
  }, "");
}

interface LabelledItem {
  id: string;
  label: string;
}

interface MatchItem {
  id: string;
  label: string;
  matchId: string;
}

interface ProgressEventPayload {
  lessonTitle: string;
  exerciseId: string;
  correct: boolean;
}

function parseLabelledItems(value: string): LabelledItem[] {
  const labels = [...value.matchAll(/(?:^|\s)([a-e])\)\s*/gi)];
  return labels
    .map((labelMatch, index) => {
      const label = labelMatch[1]?.toLowerCase();
      const start = (labelMatch.index ?? 0) + labelMatch[0].length;
      const nextLabelIndex = labels[index + 1]?.index ?? value.length;
      const text = value.slice(start, nextLabelIndex).replace(/,$/, "").trim();

      if (!label || !text) return null;

      return {
        id: label,
        label: text
      };
    })
    .filter((item): item is LabelledItem => Boolean(item));
}

function hashString(value: string): number {
  return value.split("").reduce((hash, char) => ((hash * 31) + char.charCodeAt(0)) >>> 0, 0);
}

function shuffleMatchItems(items: MatchItem[], seed: string): MatchItem[] {
  return [...items].sort((left, right) =>
    hashString(`${seed}:${left.id}:${left.label}`) - hashString(`${seed}:${right.id}:${right.label}`)
  );
}

function shuffleVocabularyView(
  view: { prompt: string; sourceItems: MatchItem[]; targetItems: MatchItem[] },
  exerciseId: string,
  seed: string
): { prompt: string; sourceItems: MatchItem[]; targetItems: MatchItem[] } {
  const sourceItems = shuffleMatchItems(view.sourceItems, `${seed}:${exerciseId}:source`);
  let targetItems = shuffleMatchItems(view.targetItems, `${seed}:${exerciseId}:target`);

  if (
    targetItems.length > 1 &&
    targetItems.every((targetItem, index) => sourceItems[index]?.matchId === targetItem.matchId)
  ) {
    targetItems = [...targetItems.slice(1), targetItems[0] as MatchItem];
  }

  return {
    ...view,
    sourceItems,
    targetItems
  };
}

function getVocabularyView(
  exercise: LessonExercise,
  vocabulary: VocabularyPair[],
  targetLanguage: string
): { prompt: string; sourceItems: MatchItem[]; targetItems: MatchItem[] } {
  const structuredPairs = exercise.matchPairs?.filter((pair) => pair.source && pair.target) ?? [];
  if (structuredPairs.length > 0) {
    return {
      prompt: `Select one English meaning, then its matching ${targetLanguage} word.`,
      sourceItems: structuredPairs.map((pair, index) => ({
        id: `source-${index}`,
        label: pair.source,
        matchId: `match-${index}`
      })),
      targetItems: structuredPairs.map((pair, index) => ({
        id: `target-${index}`,
        label: pair.target,
        matchId: `match-${index}`
      }))
    };
  }

  const labelledTargets = parseLabelledItems(exercise.prompt);
  const labelledSources = parseLabelledItems(exercise.answer);
  if (labelledSources.length > 0 && labelledTargets.length > 0) {
    return {
      prompt: `Select one English meaning, then its matching ${targetLanguage} word.`,
      sourceItems: labelledSources.map((item) => ({
        id: `source-${item.id}`,
        label: item.label,
        matchId: item.id
      })),
      targetItems: labelledTargets.map((item) => ({
        id: `target-${item.id}`,
        label: item.label,
        matchId: item.id
      }))
    };
  }

  const matchingVocabulary = vocabulary.filter((pair) => pair.source && pair.target).slice(0, 3);
  if (matchingVocabulary.length > 0) {
    return {
      prompt: `Select one English meaning, then its matching ${targetLanguage} word.`,
      sourceItems: matchingVocabulary.map((pair, index) => ({
        id: `source-${index}`,
        label: pair.source,
        matchId: `match-${index}`
      })),
      targetItems: matchingVocabulary.map((pair, index) => ({
        id: `target-${index}`,
        label: pair.target,
        matchId: `match-${index}`
      }))
    };
  }

  return {
    prompt: `Select one English meaning, then its matching ${targetLanguage} word.`,
    sourceItems: [{
      id: "source-0",
      label: exercise.sourceTerm ?? exercise.answer,
      matchId: "match-0"
    }],
    targetItems: [{
      id: "target-0",
      label: exercise.choices?.[0] ?? exercise.answer,
      matchId: "match-0"
    }]
  };
}

export default function LessonPage() {
  const router = useRouter();
  const lesson = useOrionStore((state) => state.lesson);
  const summary = useOrionStore((state) => state.summary);
  const progress = useOrionStore((state) => state.progress);
  const submitExerciseResult = useOrionStore((state) => state.submitExerciseResult);
  const completeLesson = useOrionStore((state) => state.completeLesson);

  const [exerciseQueue, setExerciseQueue] = useState<LessonExercise[]>(() => lesson?.exercises ?? []);
  const [exerciseIndex, setExerciseIndex] = useState(0);
  const [input, setInput] = useState("");
  const [feedback, setFeedback] = useState<"idle" | "correct" | "incorrect">("idle");
  const [selectedSourceId, setSelectedSourceId] = useState<string | null>(null);
  const [matchSelections, setMatchSelections] = useState<Record<string, string>>({});
  const [showHint, setShowHint] = useState(false);
  const [vocabularyShuffleSeed] = useState(() => Math.random().toString(36).slice(2));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [progressSyncError, setProgressSyncError] = useState<string | null>(null);
  const [lastFailedProgressEvent, setLastFailedProgressEvent] = useState<ProgressEventPayload | null>(null);
  const [progressSyncInProgress, setProgressSyncInProgress] = useState(false);
  const hintTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fillBlankInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const handlePrimarySubmitRef = useRef<(() => Promise<void>) | undefined>(undefined);

  useEffect(() => {
    return () => {
      if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
    };
  }, []);

  useEffect(() => {
    handlePrimarySubmitRef.current = handlePrimarySubmit;
  });

  useEffect(() => {
    const exerciseCandidate = exerciseQueue[exerciseIndex];
    if (!lesson || exerciseCandidate?.type !== "vocabulary") return;
    const vocabularyViewCandidate = shuffleVocabularyView(
      getVocabularyView(exerciseCandidate, summary?.vocabulary ?? [], lesson.targetLanguage),
      exerciseCandidate.id,
      vocabularyShuffleSeed
    );
    const onDocumentKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key !== "Enter" || event.shiftKey) return;
      const target = event.target;
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLButtonElement ||
        target instanceof HTMLAnchorElement
      ) {
        return;
      }
      if (feedback === "incorrect") {
        event.preventDefault();
        void handlePrimarySubmitRef.current?.();
        return;
      }
      if (feedback !== "idle") return;
      if (
        !vocabularyViewCandidate.sourceItems.every((sourceItem) => matchSelections[sourceItem.id])
      ) {
        return;
      }
      event.preventDefault();
      void handlePrimarySubmitRef.current?.();
    };
    document.addEventListener("keydown", onDocumentKeyDown, true);
    return () => document.removeEventListener("keydown", onDocumentKeyDown, true);
  }, [lesson, summary?.vocabulary, exerciseQueue, exerciseIndex, feedback, matchSelections, vocabularyShuffleSeed]);

  if (!lesson) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-20 text-center">
        <Card>
          <p>No lesson generated yet.</p>
          <Button className="mt-4" onClick={() => router.push("/home")}>
            Go to home
          </Button>
        </Card>
      </main>
    );
  }

  const activeLesson = lesson;
  const totalSteps = exerciseQueue.length;
  const exercise = exerciseQueue[exerciseIndex];
  if (!exercise || totalSteps === 0) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-20 text-center">
        <Card>
          <p>This lesson does not have any exercises yet.</p>
          <Button className="mt-4" onClick={() => router.push("/home")}>
            Go to home
          </Button>
        </Card>
      </main>
    );
  }

  const isLast = exerciseIndex === totalSteps - 1;
  const isTranslateExercise = exercise.type === "translate";
  const isFillBlankExercise = exercise.type === "fill_blank";
  const isVocabularyExercise = exercise.type === "vocabulary";
  const vocabularyView = shuffleVocabularyView(
    getVocabularyView(exercise, summary?.vocabulary ?? [], activeLesson.targetLanguage),
    exercise.id,
    vocabularyShuffleSeed
  );
  const fillBlankPromptSegments = getFillBlankPromptSegments(exercise.prompt, exercise.answer);
  const fillBlankCount = Math.max(1, fillBlankPromptSegments.length - 1);
  const fillBlankAnswers = getFillBlankAnswers(exercise, fillBlankPromptSegments);
  const fillBlankPlaceholders = getFillBlankPlaceholders(exercise, fillBlankAnswers, summary?.vocabulary ?? []);
  const fillBlankInputValues = input.split(" | ");
  const fillBlankInputIds = Array.from({ length: fillBlankCount }, (_, blankIndex) => `${exercise.id}-blank-${blankIndex + 1}`);
  const fillBlankSegmentIds = Array.from(
    { length: fillBlankPromptSegments.length },
    (_, segmentIndex) => `${exercise.id}-segment-${segmentIndex + 1}`
  );
  const expectedBlankAnswerText = fillBlankAnswers.join(" | ");
  const expectedVocabularyMatchText = vocabularyView.sourceItems
    .map((sourceItem) => {
      const targetItem = vocabularyView.targetItems.find((item) => item.matchId === sourceItem.matchId);
      return `${sourceItem.label} - ${targetItem?.label ?? ""}`;
    })
    .join(" | ");
  const submittedVocabularyMatchText = vocabularyView.sourceItems
    .map((sourceItem) => {
      const selectedTargetId = matchSelections[sourceItem.id];
      const targetItem = vocabularyView.targetItems.find((item) => item.id === selectedTargetId);
      return `${sourceItem.label} - ${targetItem?.label ?? "unmatched"}`;
    })
    .join(" | ");
  const acceptedTranslateAnswers = isTranslateExercise
    ? getAcceptedTranslateAnswers(exercise, activeLesson.targetLanguage)
    : [];
  const closestTranslateAnswer = isTranslateExercise
    ? getClosestExpectedAnswer(input, acceptedTranslateAnswers)
    : "";
  const expectedAnswerText = isFillBlankExercise
    ? getCompletedFillBlankAnswer(fillBlankPromptSegments, fillBlankAnswers, exercise.answer)
    : isVocabularyExercise
      ? expectedVocabularyMatchText
      : closestTranslateAnswer || exercise.answer;
  const acceptedAnswerText = acceptedTranslateAnswers.length > 1
    ? acceptedTranslateAnswers.join(" / ")
    : expectedAnswerText;
  const shouldShowSupportArea = isTranslateExercise || feedback === "incorrect" || Boolean(progressSyncError);
  const exerciseLabel =
    exercise.type === "translate" ? "Translate" : exercise.type === "fill_blank" ? "Fill in the blanks" : "Match the words";
  const exerciseTitle =
    exercise.type === "translate" ? "Translate this sentence" : exercise.type === "fill_blank" ? "Fill in the blanks" : "Match the words";
  const exerciseSubtitle =
    exercise.type === "translate"
      ? `Use the words you've learned to translate it to ${activeLesson.targetLanguage}.`
      : exercise.type === "fill_blank"
        ? `Complete the sentence in ${activeLesson.targetLanguage}.`
        : `Match each word in English with its translation in ${activeLesson.targetLanguage}.`;
  const exerciseIcon = exercise.type === "translate" ? "A" : exercise.type === "fill_blank" ? "+" : "<>";
  const canSubmit =
    !isSubmitting &&
    (feedback === "incorrect" ||
      (isVocabularyExercise
        ? vocabularyView.sourceItems.every((sourceItem) => matchSelections[sourceItem.id])
        : isFillBlankExercise
          ? Array.from({ length: fillBlankCount }).every((_, blankIndex) => (fillBlankInputValues[blankIndex] ?? "").trim())
          : input.trim().length > 0));
  const answerParts = feedback === "incorrect"
    ? compareAnswerParts(
      isVocabularyExercise ? submittedVocabularyMatchText : input,
      isFillBlankExercise ? expectedBlankAnswerText : expectedAnswerText
    )
    : [];

  const feedbackStyle = (() => {
    if (feedback === "correct") return "border-emerald-300/60 bg-emerald-500/10 shadow-[0_0_28px_rgba(16,185,129,0.12)]";
    if (feedback === "incorrect") return "border-rose-300/70 bg-rose-500/10 shadow-[0_0_28px_rgba(244,63,94,0.12)]";
    return "border-violet-400/50 bg-white/5 shadow-[0_0_28px_rgba(124,58,237,0.12)]";
  })();

  function evaluateCurrentAnswer(): boolean {
    if (isFillBlankExercise) {
      return fillBlankAnswers.every((answer, index) => evaluateAnswer(fillBlankInputValues[index] ?? "", answer));
    }

    if (isTranslateExercise) return evaluateAcceptedAnswers(input, acceptedTranslateAnswers);

    if (!isVocabularyExercise) return evaluateAnswer(input, exercise.answer);

    return vocabularyView.sourceItems.every((sourceItem) => {
      const selectedTarget = vocabularyView.targetItems.find((targetItem) => targetItem.id === matchSelections[sourceItem.id]);
      return selectedTarget?.matchId === sourceItem.matchId;
    });
  }

  function updateFillBlankInput(index: number, value: string) {
    const nextValues = Array.from({ length: fillBlankCount }, (_, blankIndex) => fillBlankInputValues[blankIndex] ?? "");
    nextValues[index] = value;
    setInput(nextValues.join(" | "));
  }

  function clearAnswerState() {
    setFeedback("idle");
    setInput("");
    setSelectedSourceId(null);
    setMatchSelections({});
    setShowHint(false);
    if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
  }

  function showExerciseHint() {
    setShowHint(true);
    if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
    hintTimerRef.current = setTimeout(() => {
      setShowHint(false);
      hintTimerRef.current = null;
    }, 3000);
  }

  function selectVocabularyTarget(targetId: string) {
    if (!selectedSourceId || feedback !== "idle") return;

    const nextSelections = Object.fromEntries(
      Object.entries(matchSelections).filter(([, selectedTargetId]) => selectedTargetId !== targetId)
    );
    nextSelections[selectedSourceId] = targetId;
    setMatchSelections(nextSelections);
    setSelectedSourceId(null);

    const submittedText = vocabularyView.sourceItems
      .map((sourceItem) => {
        const selectedTarget = vocabularyView.targetItems.find((item) => item.id === nextSelections[sourceItem.id]);
        return `${sourceItem.label} - ${selectedTarget?.label ?? "unmatched"}`;
      })
      .join(" | ");
    setInput(submittedText);
  }

  async function sendProgressEvent(payload: ProgressEventPayload): Promise<boolean> {
    setProgressSyncInProgress(true);
    setProgressSyncError(null);

    try {
      const response = await fetch("/api/progress/event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? "Progress could not be synced.");
      }

      setLastFailedProgressEvent(null);
      return true;
    } catch (error) {
      setLastFailedProgressEvent(payload);
      setProgressSyncError(
        error instanceof Error
          ? error.message
          : "Progress could not be synced. Your answer is saved locally."
      );
      return false;
    } finally {
      setProgressSyncInProgress(false);
    }
  }

  async function retryProgressSync() {
    if (!lastFailedProgressEvent) return;
    await sendProgressEvent(lastFailedProgressEvent);
  }

  async function checkAnswer(): Promise<boolean> {
    const correct = evaluateCurrentAnswer();
    setFeedback(correct ? "correct" : "incorrect");
    submitExerciseResult(correct);
    await sendProgressEvent({
      lessonTitle: activeLesson.title,
      exerciseId: exercise.id,
      correct
    });
    return correct;
  }

  async function recordLessonCompletion(): Promise<void> {
    completeLesson();
    await sendProgressEvent({
      lessonTitle: activeLesson.title,
      exerciseId: LESSON_COMPLETION_EVENT_ID,
      correct: true
    });
  }

  function moveIncorrectQuestionToEndAndAdvance() {
    const current = exerciseQueue[exerciseIndex];
    if (!current) return;

    const atLast = exerciseIndex === exerciseQueue.length - 1;
    const reordered = [
      ...exerciseQueue.slice(0, exerciseIndex),
      ...exerciseQueue.slice(exerciseIndex + 1),
      current
    ];

    setExerciseQueue(reordered);
    setExerciseIndex(atLast ? 0 : exerciseIndex);
    clearAnswerState();
  }

  async function handlePrimarySubmit(): Promise<void> {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      if (feedback === "incorrect") {
        moveIncorrectQuestionToEndAndAdvance();
        return;
      }

      const correct = await checkAnswer();
      if (correct && !isLast) {
        setExerciseIndex((index) => index + 1);
        clearAnswerState();
      } else if (correct && isLast) {
        await recordLessonCompletion();
        router.push("/lesson/completed");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleFillBlankKeyDown(segmentIndex: number, event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== "Enter") return;
    event.preventDefault();
    if (segmentIndex < fillBlankCount - 1) {
      fillBlankInputRefs.current[segmentIndex + 1]?.focus();
      return;
    }
    void handlePrimarySubmit();
  }

  function handleTranslateKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key !== "Enter" || event.shiftKey) return;
    event.preventDefault();
    void handlePrimarySubmit();
  }

  function handleExitLesson() {
    setShowExitDialog(true);
  }

  function confirmExitLesson() {
    router.push("/home");
  }

  const decorativeStars = Array.from({ length: 18 }, (_, starIndex) => ({
    id: `star-${starIndex}`,
    x: 28 + ((starIndex * 23) % 122),
    y: 18 + ((starIndex * 17) % 86)
  }));

  return (
    <main className="mx-auto flex min-h-dvh max-w-5xl flex-col px-4 py-5 sm:px-8">
      <header className="grid flex-none grid-cols-[auto_1fr_auto] items-center gap-4">
        <OrionLogo priority className="w-28 shrink-0" />

        <div className="w-72 max-w-[42vw] justify-self-center">
          <div className="flex items-center gap-2">
            {exerciseQueue.map((queuedExercise, index) => (
              <div key={queuedExercise.id} className="h-2 flex-1 overflow-hidden rounded-full bg-slate-700/60">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-violet-500 to-indigo-500 transition-all"
                  style={{ width: index <= exerciseIndex ? "100%" : "0%" }}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-self-end gap-5">
          <p className="hidden items-center gap-2 whitespace-nowrap text-sm font-medium leading-none text-slate-100 sm:flex sm:text-base">
            <span aria-hidden="true">🔥</span>
            <span>{progress.streakDays} day streak</span>
          </p>
          <button
            type="button"
            className="grid size-11 place-items-center rounded-full border border-white/10 bg-white/[0.06] text-slate-200 shadow-[0_10px_30px_rgba(0,0,0,0.24)] backdrop-blur transition hover:border-white/20 hover:bg-white/[0.12] hover:text-white focus:outline-none focus:ring-2 focus:ring-violet-400/70 focus:ring-offset-2 focus:ring-offset-[#040918]"
            aria-label="Exit lesson"
            onClick={handleExitLesson}
          >
            <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        </div>
      </header>

      <Card className="relative mt-8 flex flex-1 flex-col overflow-hidden rounded-[28px] border-slate-700/80 bg-[linear-gradient(180deg,rgba(7,13,31,0.98),rgba(4,9,24,0.98))] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.28)] sm:p-10">
        <div className="pointer-events-none absolute right-8 top-8 hidden opacity-90 sm:block">
          <svg width="170" height="130" viewBox="0 0 170 130" fill="none" aria-hidden="true">
            <path d="M44 54L74 22L120 14L142 48L112 92H70L44 54Z" stroke="url(#lesson-constellation)" strokeWidth="1.3" />
            <path d="M120 14L152 34L142 48M112 92L142 48L132 78" stroke="url(#lesson-constellation)" strokeWidth="1.3" />
            <g fill="#EDE9FE">
              <circle cx="44" cy="54" r="3.5" />
              <circle cx="74" cy="22" r="3.5" />
              <circle cx="120" cy="14" r="3.5" />
              <circle cx="142" cy="48" r="3.5" />
              <circle cx="112" cy="92" r="3.5" />
              <circle cx="70" cy="92" r="3.5" />
              <circle cx="152" cy="34" r="3" />
              <circle cx="132" cy="78" r="2.5" />
            </g>
            <g fill="#7C3AED" opacity="0.35">
              {decorativeStars.map((star) => (
                <circle key={star.id} cx={star.x} cy={star.y} r="1" />
              ))}
            </g>
            <defs>
              <linearGradient id="lesson-constellation" x1="44" y1="14" x2="152" y2="92" gradientUnits="userSpaceOnUse">
                <stop stopColor="#8B5CF6" />
                <stop offset="1" stopColor="#C4B5FD" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        <section className="relative z-10 flex min-h-0 flex-1 flex-col">
          <div className="max-w-2xl">
            <p className="inline-flex items-center gap-2 rounded-xl bg-violet-500/20 px-4 py-2 text-sm font-semibold uppercase tracking-wide text-violet-300">
              <span className="grid size-5 place-items-center rounded-md bg-violet-500/20 text-xs">{exerciseIcon}</span>
              {exerciseLabel}
            </p>
            <h1 className="mt-7 text-3xl font-semibold tracking-tight text-white sm:text-4xl">{exerciseTitle}</h1>
            <p className="mt-3 text-base text-slate-300">{exerciseSubtitle}</p>
          </div>

          <div className="mt-8 flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto pr-1">
            {isVocabularyExercise ? (
              <div className="grid gap-8 sm:grid-cols-2">
                <div>
                  <p className="mb-5 text-lg font-semibold text-slate-100">English</p>
                  <div className="space-y-3">
                    {vocabularyView.sourceItems.map((sourceItem) => {
                      const selectedTarget = vocabularyView.targetItems.find((targetItem) => targetItem.id === matchSelections[sourceItem.id]);
                      const isSelected = selectedSourceId === sourceItem.id;
                      const isCorrect = feedback !== "idle" && selectedTarget?.matchId === sourceItem.matchId;
                      const isWrong = feedback === "incorrect" && Boolean(selectedTarget) && selectedTarget?.matchId !== sourceItem.matchId;

                      return (
                        <button
                          key={sourceItem.id}
                          type="button"
                          className={[
                            "flex min-h-16 w-full items-center justify-between rounded-xl border px-5 py-4 text-left text-base transition",
                            isSelected ? "border-violet-400 bg-violet-500/20 text-white" : "border-slate-700 bg-slate-950/30 text-slate-100 hover:border-violet-400/70",
                            isCorrect ? "border-emerald-300/60 bg-emerald-500/15 text-emerald-100" : "",
                            isWrong ? "border-rose-300/70 bg-rose-500/15 text-rose-100" : ""
                          ].join(" ")}
                          disabled={feedback !== "idle"}
                          onClick={() => setSelectedSourceId(sourceItem.id)}
                        >
                          <span>{sourceItem.label}</span>
                          {selectedTarget && <span className="text-sm text-violet-200">{selectedTarget.label}</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <p className="mb-5 text-lg font-semibold text-slate-100">{activeLesson.targetLanguage}</p>
                  <div className="space-y-3">
                    {vocabularyView.targetItems.map((targetItem) => {
                      const matchedSource = vocabularyView.sourceItems.find((sourceItem) => matchSelections[sourceItem.id] === targetItem.id);
                      const isCorrect = feedback !== "idle" && matchedSource?.matchId === targetItem.matchId;
                      const isWrong = feedback === "incorrect" && Boolean(matchedSource) && matchedSource?.matchId !== targetItem.matchId;

                      return (
                        <button
                          key={targetItem.id}
                          type="button"
                          className={[
                            "flex min-h-16 w-full items-center justify-between rounded-xl border px-5 py-4 text-left text-base transition",
                            matchedSource ? "border-violet-400 bg-violet-500/20 text-white" : "border-slate-700 bg-slate-950/30 text-slate-100 hover:border-violet-400/70",
                            isCorrect ? "border-emerald-300/60 bg-emerald-500/15 text-emerald-100" : "",
                            isWrong ? "border-rose-300/70 bg-rose-500/15 text-rose-100" : "",
                            !selectedSourceId && !matchedSource ? "opacity-70" : ""
                          ].join(" ")}
                          disabled={feedback !== "idle" || (!selectedSourceId && !matchedSource)}
                          onClick={() => selectVocabularyTarget(targetItem.id)}
                        >
                          <span>{targetItem.label}</span>
                          {matchedSource && <span className="text-sm text-violet-200">{matchedSource.label}</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : isFillBlankExercise ? (
              <div className="pt-8">
                <div className="text-2xl leading-[3.5rem] text-slate-100 sm:text-3xl">
                  {fillBlankPromptSegments.map((segment, segmentIndex) => {
                    const inputId = fillBlankInputIds[segmentIndex];

                    return (
                      <span key={fillBlankSegmentIds[segmentIndex]}>
                        <span>{segment}</span>
                        {inputId && (
                          <input
                            ref={(element) => {
                              fillBlankInputRefs.current[segmentIndex] = element;
                            }}
                            aria-label={`Blank ${segmentIndex + 1}`}
                            className={`mx-2 inline-block h-12 w-40 border-0 border-b border-slate-300 bg-transparent px-2 text-center text-xl font-semibold outline-none transition placeholder:text-slate-500 sm:w-52 sm:text-2xl ${feedback === "incorrect" ? "text-rose-100" : "text-white"}`}
                            placeholder={fillBlankPlaceholders[segmentIndex] ?? ""}
                            value={fillBlankInputValues[segmentIndex] ?? ""}
                            readOnly={feedback === "incorrect"}
                            onChange={(event) => updateFillBlankInput(segmentIndex, event.target.value)}
                            onKeyDown={(event) => handleFillBlankKeyDown(segmentIndex, event)}
                          />
                        )}
                      </span>
                    );
                  })}
                </div>
              </div>
            ) : (
              <>
                <Card className="rounded-xl border-slate-700 bg-slate-950/35 p-6 text-lg text-slate-100 shadow-none">
                  {exercise.prompt}
                </Card>
                <textarea
                  className={`min-h-14 w-full resize-none rounded-xl border bg-slate-950/25 p-4 text-base text-white outline-none transition placeholder:text-slate-400 sm:min-h-[4.5rem] sm:text-lg ${feedbackStyle}`}
                  placeholder={`Type your answer in ${activeLesson.targetLanguage}...`}
                  value={input}
                  readOnly={feedback === "incorrect"}
                  onChange={(event) => setInput(event.target.value)}
                  onKeyDown={handleTranslateKeyDown}
                />
              </>
            )}

            {shouldShowSupportArea && (
              <div className="mt-auto border-t border-slate-800 pt-6">
                {isTranslateExercise && (
                  <button
                    type="button"
                    className={`mx-auto flex items-center gap-3 text-base font-medium transition ${showHint ? "text-emerald-300 hover:text-emerald-200" : "text-violet-300 hover:text-violet-200"}`}
                    onClick={showExerciseHint}
                  >
                    {!showHint && (
                      <span className="grid size-6 place-items-center rounded-full border border-violet-400/60 text-xs">?</span>
                    )}
                    {showHint ? `Answer: ${acceptedAnswerText}` : "Need a hint?"}
                  </button>
                )}

                {feedback === "incorrect" && (
                  <div className={isTranslateExercise ? "mt-4 rounded-2xl border border-rose-300/30 bg-rose-500/10 p-4 text-sm" : "rounded-2xl border border-rose-300/30 bg-rose-500/10 p-4 text-sm"}>
                    <p className="font-semibold text-rose-100">Review your answer</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {answerParts.length > 0 ? (
                        answerParts.map((part) => (
                          <span
                            key={part.id}
                            className={
                              part.status === "correct"
                                ? "rounded-lg border border-emerald-300/40 bg-emerald-500/15 px-2 py-1 text-emerald-100"
                                : "rounded-lg border border-rose-300/50 bg-rose-500/20 px-2 py-1 text-rose-100"
                            }
                          >
                            {part.token}
                          </span>
                        ))
                      ) : (
                        <span className="rounded-lg border border-rose-300/50 bg-rose-500/20 px-2 py-1 text-rose-100">
                          No answer entered
                        </span>
                      )}
                    </div>
                    <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Correct answer</p>
                    <p className="mt-1 rounded-xl border border-emerald-300/30 bg-emerald-500/10 px-3 py-2 text-emerald-100">
                      {acceptedAnswerText}
                    </p>
                  </div>
                )}

                {progressSyncError && (
                  <div className={(isTranslateExercise || feedback === "incorrect") ? "mt-4 rounded-2xl border border-amber-300/30 bg-amber-500/10 p-4 text-sm text-amber-50" : "rounded-2xl border border-amber-300/30 bg-amber-500/10 p-4 text-sm text-amber-50"} role="status" aria-live="polite">
                    <p className="font-semibold">Progress sync needs another try</p>
                    <p className="mt-1 text-amber-100/80">
                      {progressSyncError} Your answer is saved locally, but your account progress may not be up to date.
                    </p>
                    <Button
                      type="button"
                      variant="secondary"
                      className="mt-3"
                      disabled={!lastFailedProgressEvent || progressSyncInProgress}
                      onClick={() => void retryProgressSync()}
                    >
                      {progressSyncInProgress ? "Retrying..." : "Retry sync"}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        <div className="relative z-10 mt-6 flex justify-end border-t border-slate-800 pt-6">
          <Button
            className="min-w-64 rounded-xl py-4 text-base disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!canSubmit}
            onClick={() => void handlePrimarySubmit()}
          >
            {isSubmitting ? "Checking..." : feedback === "incorrect" ? "Next" : isLast ? "Finish Lesson" : "Check Answer"}
          </Button>
        </div>
      </Card>

      <Dialog
        open={showExitDialog}
        title="Leave this lesson?"
        description="Your current answer will not be submitted. You can come back from home when you are ready to continue."
        icon={<span className="text-3xl" aria-hidden="true">⚠️</span>}
        onOpenChange={setShowExitDialog}
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <Button type="button" variant="secondary" onClick={() => setShowExitDialog(false)}>
            Keep learning
          </Button>
          <button
            type="button"
            className="rounded-xl border border-rose-300/30 bg-rose-500/15 px-5 py-3 text-sm font-semibold text-rose-50 transition hover:bg-rose-500/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#040817]"
            onClick={confirmExitLesson}
          >
            Leave lesson
          </button>
        </div>
      </Dialog>
    </main>
  );
}
