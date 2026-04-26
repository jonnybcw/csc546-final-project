"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";

import { ProcessingTimeline } from "@/components/orion/processing-timeline";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ProgressStepper } from "@/components/ui/progress-stepper";
import { useOrionStore } from "@/store/orionStore";

const STEP_SEQUENCE = ["extract", "topics", "vocab", "profile"] as const;

export default function ProcessingPage() {
  const router = useRouter();
  const summary = useOrionStore((state) => state.summary);
  const processingSteps = useOrionStore((state) => state.processingSteps);
  const setProcessingStepStatus = useOrionStore((state) => state.setProcessingStepStatus);

  useEffect(() => {
    if (!summary) {
      router.push("/upload");
      return;
    }

    let index = 0;
    const interval = setInterval(() => {
      const current = STEP_SEQUENCE[index];
      if (!current) {
        clearInterval(interval);
        router.push("/review");
        return;
      }

      setProcessingStepStatus(current, "Completed");
      const next = STEP_SEQUENCE[index + 1];
      if (next) setProcessingStepStatus(next, "In progress");
      index += 1;
    }, 1400);

    return () => clearInterval(interval);
  }, [router, setProcessingStepStatus, summary]);

  const allDone = useMemo(() => processingSteps.every((step) => step.status === "Completed"), [processingSteps]);

  return (
    <main className="mx-auto max-w-4xl px-6 py-8">
      <header className="mb-8 flex items-center justify-between">
        <div className="text-2xl font-bold tracking-tight text-white">Orion</div>
        <div className="text-sm text-slate-300">Need help?</div>
      </header>

      <ProgressStepper
        steps={[
          { label: "Upload", state: "complete" },
          { label: "Processing", state: "active" },
          { label: "Review", state: "upcoming" }
        ]}
      />

      <section className="mt-12 text-center">
        <p className="text-5xl font-semibold">
          <span className="text-indigo-400">Analyzing</span> your context...
        </p>
        <p className="mx-auto mt-4 max-w-2xl text-slate-300">
          We&apos;re reading your conversations and extracting topics, vocabulary, and patterns to build
          lessons that are truly about you.
        </p>
      </section>

      <Card className="mx-auto mt-8 w-fit px-6 py-4 text-sm text-slate-300">
        This may take up to 1-2 minutes. You can leave this page, we&apos;ll keep working.
      </Card>

      <div className="mt-8">
        <ProcessingTimeline steps={processingSteps} />
      </div>

      <Card className="mt-6 flex items-center justify-between">
        <div>
          <p className="font-semibold">Your data is private and secure</p>
          <p className="text-sm text-slate-400">We encrypt your data and use it only for personalized lessons.</p>
        </div>
        {allDone && <Button onClick={() => router.push("/review")}>Continue</Button>}
      </Card>
    </main>
  );
}
