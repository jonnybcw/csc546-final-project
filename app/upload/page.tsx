"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { OnboardingShell } from "@/components/orion/onboarding-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { useOrionStore } from "@/store/orionStore";
import type { UploadApiResponse } from "@/types/orion";

type UploadState = "default" | "hover" | "success" | "error";

export default function UploadPage() {
  const router = useRouter();
  const setUploadResult = useOrionStore((state) => state.setUploadResult);
  const resetOnboarding = useOrionStore((state) => state.resetOnboarding);

  const [uploadState, setUploadState] = useState<UploadState>("default");
  const [error, setError] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canContinue = !!file && uploadState !== "error" && !isSubmitting;

  const uploadBorderClass = useMemo(() => {
    if (uploadState === "hover") return "border-indigo-300 bg-indigo-500/10";
    if (uploadState === "success") return "border-emerald-300 bg-emerald-500/10";
    if (uploadState === "error") return "border-rose-300 bg-rose-500/10";
    return "border-white/20 bg-white/5";
  }, [uploadState]);

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
    setUploadState("success");
  }

  async function onSubmit() {
    if (!file) return;
    setIsSubmitting(true);
    setError(null);

    try {
      const rawContent = await file.text();
      const response = await fetch("/api/context/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: file.name,
          mimeType: file.type,
          rawContent
        })
      });

      const body = (await response.json()) as UploadApiResponse | { error: string };

      if (!response.ok || "error" in body) {
        throw new Error("error" in body ? body.error : "Upload failed");
      }

      resetOnboarding();
      setUploadResult(file.name, body.records, body.summary);
      router.push("/processing");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Upload failed");
      setUploadState("error");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <OnboardingShell
      step="upload"
      left={
        <div className="space-y-6">
          <h1 className="text-4xl font-semibold leading-tight">
            Let&apos;s build lessons <br /> from <span className="text-indigo-400">your world.</span>
          </h1>
          <p className="text-slate-300">
            Upload your conversation data and we&apos;ll turn your interests into personalized language lessons.
          </p>
          <Card className="space-y-4">
            <p className="font-semibold">Your context, your lessons</p>
            <p className="text-sm text-slate-400">Use your conversations and topics to make lessons relevant.</p>
            <p className="font-semibold">Private and secure</p>
            <p className="text-sm text-slate-400">Your data is encrypted and never shared.</p>
            <p className="font-semibold">Smarter every day</p>
            <p className="text-sm text-slate-400">The more context you share, the better your lessons become.</p>
          </Card>
        </div>
      }
      right={
        <Card className="space-y-5 p-7">
          <div>
            <p className="text-2xl font-semibold">Upload your context file</p>
            <p className="mt-2 text-sm text-slate-400">
              Export your data from ChatGPT or Gemini and upload it here.
            </p>
          </div>

          <div className="flex gap-3">
            <Chip>JSON (Recommended)</Chip>
            <Chip className="bg-emerald-500/10 text-emerald-100">CSV (Also supported)</Chip>
          </div>

          <label
            className={`flex min-h-56 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center transition ${uploadBorderClass}`}
            onDragEnter={() => setUploadState("hover")}
            onDragLeave={() => setUploadState(file ? "success" : "default")}
            onDragOver={(event) => {
              event.preventDefault();
              setUploadState("hover");
            }}
            onDrop={(event) => {
              event.preventDefault();
              onFileChange(event.dataTransfer.files?.[0] ?? null);
            }}
          >
            <p className="text-lg font-medium">Drag and drop your file here</p>
            <p className="my-2 text-sm text-slate-400">or</p>
            <span className="rounded-lg bg-indigo-500 px-4 py-2 text-sm font-semibold text-white">Choose file</span>
            <input
              className="hidden"
              type="file"
              accept=".json,.csv"
              onChange={(event) => onFileChange(event.target.files?.[0] ?? null)}
            />
            {file && <p className="mt-4 text-sm text-emerald-300">Uploaded: {file.name}</p>}
            {error && <p className="mt-3 text-sm text-rose-300">{error}</p>}
          </label>

          <Card className="space-y-2 border-indigo-200/20">
            <p className="font-semibold">How do I export my data?</p>
            <p className="text-sm text-slate-400">ChatGPT: Settings &gt; Data Controls &gt; Export Data</p>
            <p className="text-sm text-slate-400">Gemini: Activity &gt; Manage Activity &gt; Download your data</p>
            <p className="text-sm text-indigo-300">View detailed guide</p>
          </Card>

          <p className="text-xs text-slate-400">
            Your data is encrypted and used only to generate personalized lessons.
          </p>

          <div className="flex items-center justify-between pt-3">
            <Button variant="secondary" onClick={() => router.push("/")}>
              Back
            </Button>
            <Button disabled={!canContinue} onClick={onSubmit}>
              {isSubmitting ? "Uploading..." : "Upload & Continue"}
            </Button>
          </div>
        </Card>
      }
    />
  );
}
