"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { ContextFlowLayout } from "@/components/orion/context-flow-layout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { useOrionStore } from "@/store/orionStore";
import type { LessonGenerationResponse, ProficiencyLevel } from "@/types/orion";

const LEVELS: ProficiencyLevel[] = [
  "Beginner",
  "Elementary",
  "Intermediate",
  "Upper Intermediate",
  "Advanced"
];

export default function ReviewPage() {
  const router = useRouter();
  const summary = useOrionStore((state) => state.summary);
  const removeInterest = useOrionStore((state) => state.removeInterest);
  const addInterest = useOrionStore((state) => state.addInterest);
  const setLevel = useOrionStore((state) => state.setLevel);
  const setLesson = useOrionStore((state) => state.setLesson);
  const progress = useOrionStore((state) => state.progress);
  const targetLanguage = useOrionStore((state) => state.targetLanguage);
  const extractionSource = useOrionStore((state) => state.extractionSource);
  const extractionError = useOrionStore((state) => state.extractionError);
  const setLessonError = useOrionStore((state) => state.setLessonError);

  const [newInterest, setNewInterest] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);

  const levelIndex = useMemo(() => LEVELS.indexOf(summary?.level ?? "Intermediate"), [summary?.level]);
  const isManualContext = extractionSource === "manual";

  async function handleGenerateLessons() {
    setIsGenerating(true);
    setGenerationError(null);

    try {
      const response = await fetch("/api/lesson/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          summary,
          progress,
          targetLanguage: targetLanguage ?? "Spanish",
          contextSource: extractionSource ?? "manual"
        })
      });

      if (!response.ok) {
        const failedBody = (await response.json()) as { error?: string };
        throw new Error(failedBody.error ?? "AI lesson generation failed");
      }

      const payload = (await response.json()) as LessonGenerationResponse;
      setLesson(payload.lesson, payload.source);
      router.push("/home");
    } catch (error) {
      const message = error instanceof Error ? error.message : "AI lesson generation failed.";
      setLessonError(message);
      setGenerationError(message);
    } finally {
      setIsGenerating(false);
    }
  }

  function addInterestFromInput() {
    const value = newInterest.trim();
    if (!value) return;
    addInterest(value);
    setNewInterest("");
  }

  if (!summary) {
    return (
      <ContextFlowLayout activeStep="review">
        <Card className="mx-auto max-w-lg border-white/10 p-6 text-center sm:p-8">
          <p className="text-lg font-medium text-white">No learning profile found.</p>
          <Button className="mt-6" onClick={() => router.push("/upload")}>
            Go to upload
          </Button>
        </Card>
      </ContextFlowLayout>
    );
  }

  return (
    <ContextFlowLayout activeStep="review">
      <div className="text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-4xl">
          Review your{" "}
          <span className="bg-gradient-to-r from-violet-400 to-sky-400 bg-clip-text text-transparent">
            learning profile
          </span>
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-slate-400 sm:text-base">
          {isManualContext
            ? "We built the profile below from your interests. Review and edit anything before we create your lessons."
            : "We've extracted the information below from your conversations. Review and edit anything before we create your lessons."}
        </p>
      </div>

      <Card className="mx-auto mt-8 max-w-2xl border border-white/[0.08] bg-[linear-gradient(180deg,rgba(15,23,42,0.55),rgba(8,12,28,0.88))] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.4)] sm:mt-10 sm:p-8">
        <section className="border-b border-white/10 pb-6 sm:pb-8">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="flex items-center gap-2 text-lg font-semibold text-white">
                <span className="text-amber-200/90" aria-hidden>
                  ★
                </span>
                Top interests
              </p>
              <p className="mt-1 text-sm text-slate-500">
                {isManualContext
                  ? "These are the topics you entered for personalization."
                  : "These are the main topics we found in your conversations."}
              </p>
            </div>
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center">
              <input
                className="min-h-11 min-w-[8rem] flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none placeholder:text-slate-600 focus:border-violet-500/40"
                value={newInterest}
                onChange={(event) => setNewInterest(event.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addInterestFromInput()}
                placeholder="Add interest"
              />
              <Button type="button" variant="secondary" className="w-full shrink-0 whitespace-nowrap sm:w-auto" onClick={addInterestFromInput}>
                + Add interest
              </Button>
            </div>
          </div>
          {summary.interests.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {summary.interests.map((interest) => (
                <Chip key={interest} className="border-white/15 bg-white/[0.04] py-1.5 pr-1 text-slate-200">
                  {interest}
                  <button
                    type="button"
                    className="ml-1 rounded-md px-2 py-0.5 text-xs text-slate-500 hover:bg-white/10 hover:text-slate-200"
                    aria-label={`Remove ${interest}`}
                    onClick={() => removeInterest(interest)}
                  >
                    ×
                  </button>
                </Chip>
              ))}
            </div>
          ) : (
            <p className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-slate-400">
              No interests found yet. Add a topic you care about so Orion can personalize the lesson.
            </p>
          )}
        </section>

        <section className="border-b border-white/10 py-6 sm:py-8">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="flex items-center gap-2 text-lg font-semibold text-white">
                <span className="text-violet-300/90" aria-hidden>
                  📊
                </span>
                Detected language level
              </p>
              <p className="mt-1 text-sm text-slate-500">
                {isManualContext
                  ? "Set a starting level for lessons based on your current comfort."
                  : "Based on your vocabulary, grammar and conversation complexity."}
              </p>
            </div>
            <label className="sr-only" htmlFor="level-select">
              Language level
            </label>
            <select
              id="level-select"
              value={summary.level}
              onChange={(e) => setLevel(e.target.value as ProficiencyLevel)}
              className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2.5 text-sm text-slate-200 outline-none focus:border-violet-500/50 sm:w-56"
            >
              {LEVELS.map((level) => (
                <option key={level} value={level}>
                  {level}
                </option>
              ))}
            </select>
          </div>

          <div className="relative -mx-1 mt-6 overflow-x-auto px-1 pb-2 sm:mx-0 sm:overflow-visible sm:px-2 sm:pb-0">
            <div className="absolute left-8 right-8 top-[9px] h-px bg-white/15 sm:left-10 sm:right-10" aria-hidden />
            <div className="relative flex min-w-[420px] justify-between gap-1 sm:min-w-0">
              {LEVELS.map((level, index) => {
                const selected = index === levelIndex;
                return (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setLevel(level)}
                    className="flex flex-1 flex-col items-center gap-2 text-center focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/60 rounded-lg py-1"
                  >
                    <span
                      className={`rounded-full transition-all ${
                        selected
                          ? "h-4 w-4 ring-4 ring-violet-500/30 bg-gradient-to-br from-violet-400 to-indigo-400"
                          : "h-2.5 w-2.5 bg-white/25 hover:bg-white/40"
                      }`}
                    />
                    <span
                      className={`hidden max-w-[4.25rem] text-[10px] font-medium leading-tight sm:block sm:text-xs ${
                        selected ? "text-violet-200" : "text-slate-600"
                      }`}
                    >
                      {level.replace(" Upper", "\nUpper").split("\n").join(" ")}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        <section className="border-b border-white/10 py-6 sm:py-8">
          <p className="mb-4 text-lg font-semibold text-white">Conversation themes</p>
          {summary.themes.length > 0 ? (
            <div className="grid gap-2 sm:grid-cols-2">
              {summary.themes.slice(0, 6).map((theme) => (
                <div
                  key={theme.name}
                  className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3"
                >
                  <span className="text-sm font-medium text-slate-200">{theme.name}</span>
                  <span className="text-sm text-violet-300">{theme.percentage}%</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-slate-400">
              We did not find strong themes in the upload. You can still generate a lesson from interests and vocabulary.
            </p>
          )}
        </section>

        <section className="pt-6 sm:pt-8">
          <p className="mb-4 text-lg font-semibold text-white">Sample vocabulary</p>
          {summary.vocabulary.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {summary.vocabulary.slice(0, 12).map((item) => (
                <Chip key={`${item.source}-${item.target}`} className="border-white/10 bg-white/[0.04] text-slate-300">
                  {item.source}
                  <span className="text-slate-600">→</span>
                  {item.target}
                </Chip>
              ))}
            </div>
          ) : (
            <p className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-slate-400">
              No vocabulary pairs were extracted. Orion can still create a lesson, but adding vocabulary in settings later will improve matching exercises.
            </p>
          )}
        </section>

        <div className="mt-8 flex flex-col gap-2 rounded-xl border border-amber-500/15 bg-amber-500/[0.06] p-4 min-[420px]:flex-row min-[420px]:items-start min-[420px]:gap-3">
          <span aria-hidden className="text-lg">
            💡
          </span>
          <p className="text-sm leading-relaxed text-slate-300">
            This information will be used to create personalized lessons that are relevant and engaging.
          </p>
        </div>

        {(extractionError || generationError) && (
          <div className="mt-6 space-y-2" role="status" aria-live="polite">
            {extractionError && (
              <p className="rounded-lg border border-amber-400/25 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
                {extractionError}
              </p>
            )}
            {generationError && (
              <p className="rounded-lg border border-rose-400/25 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
                {generationError}
              </p>
            )}
            {generationError && (
              <Button
                type="button"
                variant="secondary"
                className="w-full sm:w-auto"
                disabled={isGenerating}
                onClick={handleGenerateLessons}
              >
                Retry lesson generation
              </Button>
            )}
          </div>
        )}

        <p className="mt-4 text-center text-xs text-slate-600">
          Profile source: {extractionSource === "ai" ? "AI" : extractionSource === "manual" ? "Manual" : "Unknown"} · Target language:{" "}
          {targetLanguage ?? "Spanish"}
        </p>

        <div className="mt-8 flex flex-col-reverse gap-4 border-t border-white/10 pt-6 sm:mt-10 sm:flex-row sm:items-center sm:justify-between sm:pt-8">
          <Button variant="secondary" className="w-full gap-2 sm:w-auto" onClick={() => router.push("/upload")}>
            <span aria-hidden>←</span>
            Back
          </Button>
          <div className="flex w-full flex-col items-stretch gap-2 sm:w-auto sm:items-end">
            <Button className="w-full gap-2 sm:w-auto sm:min-w-[220px]" disabled={isGenerating} onClick={handleGenerateLessons}>
              {isGenerating ? "Generating lesson..." : "Generate my lessons"}
              {!isGenerating && <span aria-hidden>→</span>}
            </Button>
            <p className="text-center text-xs text-slate-500 sm:text-right">You&apos;ll be taken to your home page next.</p>
          </div>
        </div>
      </Card>

      <p className="mt-8 text-center text-sm text-slate-600">
        <Link href="/#privacy" className="text-violet-400/80 hover:text-violet-300">
          How we use your data
        </Link>
      </p>
    </ContextFlowLayout>
  );
}
