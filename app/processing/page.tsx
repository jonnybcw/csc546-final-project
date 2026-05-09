"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { ContextFlowLayout } from "@/components/orion/context-flow-layout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useOrionStore } from "@/store/orionStore";
import type { UploadApiResponse } from "@/types/orion";

const STEP_SEQUENCE = ["topics", "vocab", "profile"] as const;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function ConstellationGraphic() {
  return (
    <div className="relative mx-auto mt-8 h-32 w-full max-w-md sm:mt-10 sm:h-40" aria-hidden>
      <svg viewBox="0 0 240 140" className="h-full w-full opacity-90">
        <title>Decoration</title>
        <ellipse cx="120" cy="95" rx="100" ry="28" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
        <ellipse cx="120" cy="95" rx="70" ry="20" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
        <line x1="70" y1="55" x2="115" y2="78" stroke="rgba(199,210,254,0.35)" strokeWidth="1" />
        <line x1="115" y1="78" x2="165" y2="52" stroke="rgba(199,210,254,0.35)" strokeWidth="1" />
        <line x1="115" y1="78" x2="128" y2="105" stroke="rgba(199,210,254,0.35)" strokeWidth="1" />
        <circle cx="70" cy="55" r="3" fill="rgba(196,181,253,0.95)" />
        <circle cx="115" cy="78" r="3.5" fill="rgba(165,243,252,0.9)" />
        <circle cx="165" cy="52" r="2.8" fill="rgba(196,181,253,0.95)" />
        <circle cx="128" cy="105" r="2.6" fill="rgba(147,197,253,0.85)" />
        <circle cx="95" cy="92" r="2" fill="rgba(255,255,255,0.35)" />
        <circle cx="152" cy="88" r="2" fill="rgba(255,255,255,0.3)" />
      </svg>
    </div>
  );
}

export default function ProcessingPage() {
  const router = useRouter();
  const summary = useOrionStore((state) => state.summary);
  const targetLanguage = useOrionStore((state) => state.targetLanguage);
  const pendingUploadFile = useOrionStore((state) => state.pendingUploadFile);
  const uploadStarted = useOrionStore((state) => state.uploadStarted);
  const uploadInProgress = useOrionStore((state) => state.uploadInProgress);
  const uploadError = useOrionStore((state) => state.uploadError);
  const processingSteps = useOrionStore((state) => state.processingSteps);
  const setUploadInProgress = useOrionStore((state) => state.setUploadInProgress);
  const setUploadStarted = useOrionStore((state) => state.setUploadStarted);
  const setUploadError = useOrionStore((state) => state.setUploadError);
  const setPendingUploadFile = useOrionStore((state) => state.setPendingUploadFile);
  const setUploadResult = useOrionStore((state) => state.setUploadResult);
  const setProcessingStepStatus = useOrionStore((state) => state.setProcessingStepStatus);
  const [retryCount, setRetryCount] = useState(0);

  // biome-ignore lint/correctness/useExhaustiveDependencies: retryCount bumps the effect to rerun the upload after Retry
  useEffect(() => {
    if (!pendingUploadFile && !summary) {
      router.replace("/upload");
      return;
    }

    if (!pendingUploadFile || uploadStarted || uploadInProgress || uploadError) return;

    const runUploadAndProcessing = async () => {
      setUploadStarted(true);
      setUploadError(null);
      setUploadInProgress(true);
      setProcessingStepStatus("upload", "In progress");
      setProcessingStepStatus("extract", "Pending");
      setProcessingStepStatus("topics", "Pending");
      setProcessingStepStatus("vocab", "Pending");
      setProcessingStepStatus("profile", "Pending");

      try {
        const rawContent = await pendingUploadFile.text();
        const response = await fetch("/api/context/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileName: pendingUploadFile.name,
            mimeType: pendingUploadFile.type,
            rawContent,
            targetLanguage: targetLanguage ?? "Spanish"
          })
        });

        const body = (await response.json()) as UploadApiResponse | { error: string };
        if (!response.ok || "error" in body) {
          throw new Error("error" in body ? body.error : "Upload failed");
        }

        setProcessingStepStatus("upload", "Completed");
        setProcessingStepStatus("extract", "In progress");
        await delay(900);
        setProcessingStepStatus("extract", "Completed");

        setUploadResult(pendingUploadFile.name, body.records, body.summary, body.source);
        setPendingUploadFile(null);

        for (const stepId of STEP_SEQUENCE) {
          setProcessingStepStatus(stepId, "In progress");
          await delay(900);
          setProcessingStepStatus(stepId, "Completed");
        }

        router.push("/review");
      } catch (error) {
        setUploadError(error instanceof Error ? error.message : "Processing failed");
        setProcessingStepStatus("upload", "Pending");
        setProcessingStepStatus("extract", "Pending");
        setProcessingStepStatus("topics", "Pending");
        setProcessingStepStatus("vocab", "Pending");
        setProcessingStepStatus("profile", "Pending");
      } finally {
        setUploadInProgress(false);
      }
    };

    void runUploadAndProcessing();
  }, [
    pendingUploadFile,
    retryCount,
    router,
    setPendingUploadFile,
    setProcessingStepStatus,
    setUploadError,
    setUploadInProgress,
    setUploadStarted,
    setUploadResult,
    summary,
    targetLanguage,
    uploadError,
    uploadStarted,
    uploadInProgress
  ]);

  const { progressPercent, displayTitle, displayDetail } = useMemo(() => {
    const total = processingSteps.length;
    const completed = processingSteps.filter((s) => s.status === "Completed").length;
    const pct = total === 0 ? 0 : Math.round((completed / total) * 100);
    const active = processingSteps.find((s) => s.status === "In progress");
    const fallback = processingSteps.find((s) => s.status === "Pending");
    const focus = active ?? fallback ?? processingSteps[0];
    return {
      progressPercent: pct,
      displayTitle: focus?.title ?? "Processing",
      displayDetail: focus?.detail ?? ""
    };
  }, [processingSteps]);

  return (
    <ContextFlowLayout activeStep="processing">
      <div className="text-center">
        <p className="text-violet-300" aria-hidden>
          ✦ ✦
        </p>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight text-white sm:text-4xl">
          <span className="bg-gradient-to-r from-violet-400 to-indigo-300 bg-clip-text text-transparent">
            Analyzing
          </span>{" "}
          your context…
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-slate-400 sm:text-base">
          We&apos;re reading your conversations and extracting topics, vocabulary, and patterns to build lessons
          that are truly about you.
        </p>
      </div>

      <ConstellationGraphic />

      <Card className="mx-auto mt-6 flex max-w-lg flex-col gap-3 border-white/10 bg-white/[0.03] px-4 py-4 sm:mt-8 sm:flex-row sm:items-start sm:gap-4 sm:px-5">
        <span className="text-xl text-slate-400" aria-hidden>
          ◷
        </span>
        <p className="text-left text-sm text-slate-300">
          <span className="font-semibold text-violet-300">This may take up to 1–2 minutes.</span> You can leave this
          page—we&apos;ll keep working.
        </p>
      </Card>

      <Card className="mx-auto mt-6 max-w-lg border-white/10 p-4 sm:p-5">
        <div className="flex gap-3 sm:gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-violet-400/25 bg-violet-500/10">
            <span className="h-8 w-8 animate-spin rounded-full border-2 border-violet-400/30 border-t-violet-400" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-white">{displayTitle}</p>
            <p className="mt-1 text-sm text-slate-400">{displayDetail}</p>
            <div className="mt-4 flex items-center gap-3">
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-violet-500 to-indigo-500 transition-[width] duration-500"
                  style={{ width: `${uploadError ? 0 : progressPercent}%` }}
                />
              </div>
              <span className="w-11 text-right text-sm font-semibold text-violet-200">
                {uploadError ? "—" : `${progressPercent}%`}
              </span>
            </div>
          </div>
        </div>
      </Card>

      <Card className="mx-auto mt-4 max-w-lg border-white/[0.08] bg-white/[0.02] p-4 sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex flex-col gap-3 min-[420px]:flex-row">
            <span className="text-lg text-slate-500" aria-hidden>
              🔒
            </span>
            <div>
              <p className="font-semibold text-slate-100">Your data is private and secure</p>
              <p className="mt-1 text-sm leading-relaxed text-slate-500">
                We encrypt your data and use it only to generate personalized lessons. You&apos;re in control.
              </p>
              {uploadError && (
                <p className="mt-3 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-100">
                  {uploadError}
                </p>
              )}
            </div>
          </div>
          <div className="flex shrink-0 flex-col items-stretch gap-2 sm:items-end">
            {uploadError && (
              <>
                <Button
                  variant="secondary"
                  className="w-full sm:w-auto"
                  onClick={() => {
                    router.push("/upload");
                  }}
                >
                  Back to upload
                </Button>
                <Button
                  className="w-full sm:w-auto"
                  onClick={() => {
                    setUploadError(null);
                    setUploadStarted(false);
                    setRetryCount((value) => value + 1);
                  }}
                >
                  Retry
                </Button>
              </>
            )}
            <Link
              href="/#privacy"
              className="inline-flex items-center gap-1 text-sm font-medium text-violet-300 hover:text-violet-200"
            >
              Privacy on Orion <span aria-hidden>→</span>
            </Link>
          </div>
        </div>
      </Card>
    </ContextFlowLayout>
  );
}
