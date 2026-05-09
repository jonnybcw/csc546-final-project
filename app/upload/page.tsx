"use client";

import Link from "next/link";
import { useEffect, useId, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { ContextFlowLayout } from "@/components/orion/context-flow-layout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { buildManualContextRecords, buildManualContextSummary } from "@/lib/manualContext";
import { useOrionStore } from "@/store/orionStore";

type UploadMode = "upload" | "manual";
type UploadState = "default" | "hover" | "error";

export default function UploadPage() {
  const router = useRouter();
  const fileInputId = useId();
  const setPendingUploadFile = useOrionStore((state) => state.setPendingUploadFile);
  const setManualContext = useOrionStore((state) => state.setManualContext);
  const setUploadError = useOrionStore((state) => state.setUploadError);
  const resetOnboarding = useOrionStore((state) => state.resetOnboarding);
  const targetLanguage = useOrionStore((state) => state.targetLanguage);

  const [mode, setMode] = useState<UploadMode>("upload");
  const [uploadState, setUploadState] = useState<UploadState>("default");
  const [error, setError] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [manualInterests, setManualInterests] = useState([""]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const hasManualInterests = manualInterests.some((interest) => interest.trim().length > 0);
  const canContinue =
    mode === "upload"
      ? !!file && uploadState !== "error" && !isSubmitting
      : hasManualInterests && !isSubmitting;

  const dropZoneClass = useMemo(() => {
    if (uploadState === "hover") return "border-violet-400/80 bg-violet-500/10";
    if (uploadState === "error") return "border-rose-400/50 bg-rose-500/5";
    if (file) return "border-violet-500/40 bg-violet-500/[0.06]";
    return "border-violet-400/35 bg-white/[0.02]";
  }, [uploadState, file]);

  useEffect(() => {
    if (!targetLanguage) {
      router.replace("/language");
    }
  }, [router, targetLanguage]);

  function validateFile(candidate: File | null): string | null {
    if (!candidate) return "Please choose a file.";
    const valid = candidate.name.endsWith(".json") || candidate.name.endsWith(".csv");
    if (!valid) return "Invalid format. Upload JSON or CSV.";
    return null;
  }

  function onFileChange(candidate: File | null) {
    const validation = validateFile(candidate);
    if (validation) {
      setError(validation);
      setUploadState("error");
      setFile(null);
      return;
    }

    setFile(candidate);
    setError(null);
    setUploadState("default");
  }

  function setManualInterest(index: number, value: string) {
    setManualInterests((interests) =>
      interests.map((interest, interestIndex) => (interestIndex === index ? value : interest))
    );
  }

  function addManualInterest() {
    setManualInterests((interests) => [...interests, ""]);
  }

  function removeManualInterest(index: number) {
    setManualInterests((interests) => {
      const nextInterests = interests.filter((_, interestIndex) => interestIndex !== index);
      return nextInterests.length > 0 ? nextInterests : [""];
    });
  }

  async function onSubmit() {
    if (mode === "upload" && !file) return;
    if (mode === "manual" && !hasManualInterests) {
      setError("Add at least one interest to continue.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      resetOnboarding();
      setUploadError(null);
      if (mode === "upload") {
        setPendingUploadFile(file);
        router.push("/processing");
        return;
      }

      const summary = buildManualContextSummary(manualInterests);
      const records = buildManualContextRecords(manualInterests);
      setManualContext(summary, records);
      router.push("/review");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Setup failed");
      setUploadState("error");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <ContextFlowLayout activeStep="upload">
      <div className="rounded-2xl border border-white/[0.08] bg-[linear-gradient(180deg,rgba(15,23,42,0.6),rgba(8,12,28,0.85))] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.45)] sm:p-8">
        <h1 className="text-center text-2xl font-semibold tracking-tight text-white sm:text-4xl">
          {mode === "upload" ? "Upload your context file" : "Tell us what interests you"}
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-center text-sm leading-relaxed text-slate-400">
          {mode === "upload"
            ? "Export your data from ChatGPT or Gemini and upload the file here. We support the following formats."
            : "Add a few topics you care about and Orion will create lessons around them without needing a file."}
        </p>
        <p className="mt-2 text-center text-xs text-slate-600">Target language: {targetLanguage ?? "—"}</p>

        <div className="mx-auto mt-6 grid max-w-md grid-cols-2 rounded-2xl border border-white/10 bg-white/[0.03] p-1">
          <button
            type="button"
            className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
              mode === "upload" ? "bg-violet-500 text-white shadow-lg shadow-violet-500/20" : "text-slate-400 hover:text-white"
            }`}
            onClick={() => {
              setMode("upload");
              setError(null);
              setUploadState("default");
            }}
          >
            Upload
          </button>
          <button
            type="button"
            className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
              mode === "manual" ? "bg-violet-500 text-white shadow-lg shadow-violet-500/20" : "text-slate-400 hover:text-white"
            }`}
            onClick={() => {
              setMode("manual");
              setError(null);
              setUploadState("default");
            }}
          >
            Manual
          </button>
        </div>

        {mode === "upload" ? (
          <>
            <div className="mt-7 grid gap-3 sm:mt-8 sm:grid-cols-2">
              <div className="flex items-center gap-3 rounded-xl border border-violet-500/25 bg-violet-500/[0.07] px-4 py-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-500/20 text-lg font-bold text-violet-200">
                  {"{}"}
                </span>
                <div>
                  <p className="font-semibold text-white">JSON</p>
                  <p className="text-xs text-violet-300">Recommended</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-300">
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" aria-hidden>
                    <title>CSV icon</title>
                    <path
                      strokeLinecap="round"
                      strokeWidth="1.5"
                      d="M8 8h8M8 12h8M8 16h5"
                    />
                  </svg>
                </span>
                <div>
                  <p className="font-semibold text-white">CSV</p>
                  <p className="text-xs text-slate-500">Also supported</p>
                </div>
              </div>
            </div>

            <div className="mt-3 flex justify-center">
              <Link
                href="/samples/orion-context-sample.json"
                download="orion-context-sample.json"
                className="text-xs font-medium text-slate-500 underline-offset-4 transition hover:text-violet-300 hover:underline"
              >
                View sample file
              </Link>
            </div>

            <label
              htmlFor={fileInputId}
              className={`mt-6 flex min-h-[180px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-4 py-7 text-center transition sm:min-h-[200px] sm:py-8 ${dropZoneClass}`}
              onDragEnter={() => setUploadState("hover")}
              onDragLeave={() => setUploadState("default")}
              onDragOver={(event) => {
                event.preventDefault();
                setUploadState("hover");
              }}
              onDrop={(event) => {
                event.preventDefault();
                setUploadState("default");
                onFileChange(event.dataTransfer.files?.[0] ?? null);
              }}
            >
              <span className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-violet-500/20 text-violet-300">
                <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" aria-hidden>
                  <title>Upload</title>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.5"
                    d="M7 16a4 4 0 0 0 4 4h2a4 4 0 0 0 4-4M12 4v12m0 0-3-3m3 3 3-3"
                  />
                </svg>
              </span>
              <p className="text-base font-medium text-slate-200">Drag and drop your file here</p>
              <p className="my-2 text-sm text-slate-500">or</p>
              <span className="pointer-events-none rounded-xl bg-gradient-to-r from-violet-500 to-indigo-500 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-500/25">
                Choose file
              </span>
              <input
                id={fileInputId}
                className="sr-only"
                type="file"
                accept=".json,.csv"
                onChange={(event) => onFileChange(event.target.files?.[0] ?? null)}
              />
              {file && <p className="mt-4 text-sm text-emerald-400/90">Selected: {file.name}</p>}
              {error && <p className="mt-3 text-sm text-rose-300">{error}</p>}
            </label>

            <Card className="mt-6 border-indigo-400/15 bg-indigo-500/[0.04] p-4 sm:p-5">
              <div className="flex flex-col gap-3 min-[420px]:flex-row">
                <span className="text-lg" aria-hidden>
                  💡
                </span>
                <div className="min-w-0 space-y-2">
                  <p className="font-semibold text-slate-100">How do I export my data?</p>
                  <p className="text-sm leading-relaxed text-slate-400">
                    In ChatGPT, go to Settings &gt; Data Controls &gt; Export Data.
                  </p>
                  <p className="text-sm leading-relaxed text-slate-400">
                    In Gemini, go to Activity &gt; Manage Activity &gt; Download your data.
                  </p>
                  <Link
                    href="/#faq"
                    className="inline-flex items-center gap-1 pt-1 text-sm font-medium text-violet-300 hover:text-violet-200"
                  >
                    View common questions <span aria-hidden>→</span>
                  </Link>
                </div>
              </div>
            </Card>
          </>
        ) : (
          <Card className="mt-7 border-violet-400/15 bg-violet-500/[0.04] p-4 sm:mt-8 sm:p-5">
            <div className="space-y-4">
              <div>
                <p className="font-semibold text-slate-100">Your interests</p>
                <p className="mt-1 text-sm text-slate-500">
                  Add topics like cooking, travel, gaming, finance, fitness, or anything you want lessons to include.
                </p>
              </div>
              <div className="space-y-3">
                {manualInterests.map((interest, index) => (
                  <div key={index} className="flex gap-2">
                    <label className="sr-only" htmlFor={`manual-interest-${index}`}>
                      Interest {index + 1}
                    </label>
                    <input
                      id={`manual-interest-${index}`}
                      className="min-h-11 flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-100 outline-none placeholder:text-slate-600 focus:border-violet-500/40"
                      value={interest}
                      onChange={(event) => setManualInterest(index, event.target.value)}
                      placeholder={index === 0 ? "e.g. cooking" : "Add another interest"}
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      className="shrink-0 px-3"
                      onClick={() => removeManualInterest(index)}
                      aria-label={`Remove interest ${index + 1}`}
                    >
                      ×
                    </Button>
                  </div>
                ))}
              </div>
              {error && <p className="text-sm text-rose-300">{error}</p>}
              <Button type="button" variant="secondary" className="w-full sm:w-auto" onClick={addManualInterest}>
                + Add another interest
              </Button>
            </div>
          </Card>
        )}

        <div className="mt-5 flex items-start gap-3 text-sm text-slate-500">
          <span className="mt-0.5 text-emerald-400/90" aria-hidden>
            ✓
          </span>
          <p>
            <span className="font-medium text-slate-300">Privacy: </span>
            Your data is encrypted and used only to generate personalized lessons.
          </p>
        </div>

        <div className="mt-8 flex flex-col-reverse gap-4 border-t border-white/10 pt-6 sm:mt-10 sm:flex-row sm:items-center sm:justify-between sm:pt-8">
          <Button variant="secondary" className="w-full gap-2 sm:w-auto" onClick={() => router.push("/language")}>
            <span aria-hidden>←</span>
            Back
          </Button>
          <div className="flex w-full flex-col items-stretch gap-2 sm:w-auto sm:items-end">
            <Button
              className="w-full gap-2 sm:w-auto sm:min-w-[200px]"
              disabled={!canContinue}
              onClick={onSubmit}
            >
              {mode === "upload" && <span aria-hidden>🔒</span>}
              {isSubmitting ? "Starting…" : mode === "upload" ? "Upload & Continue" : "Continue to Review"}
            </Button>
            {!canContinue && (
              <p className="text-center text-xs text-slate-500 sm:text-right">
                {mode === "upload" ? "Please upload a file to continue." : "Add at least one interest to continue."}
              </p>
            )}
          </div>
        </div>
      </div>
    </ContextFlowLayout>
  );
}
