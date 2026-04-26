import type { ReactNode } from "react";

import { ProgressStepper } from "@/components/ui/progress-stepper";

interface OnboardingShellProps {
  step: "upload" | "processing" | "review";
  left: ReactNode;
  right: ReactNode;
}

const STEP_ORDER = ["upload", "processing", "review"] as const;

export function OnboardingShell({ step, left, right }: OnboardingShellProps) {
  const activeIndex = STEP_ORDER.indexOf(step);

  return (
    <main className="mx-auto max-w-7xl px-6 py-8">
      <header className="mb-8 flex items-center justify-between">
        <div className="text-2xl font-bold tracking-tight text-white">Orion</div>
        <div className="text-sm text-slate-300">Need help?</div>
      </header>

      <div className="mb-10">
        <ProgressStepper
          steps={[
            { label: "Upload", state: activeIndex > 0 ? "complete" : activeIndex === 0 ? "active" : "upcoming" },
            {
              label: "Processing",
              state: activeIndex > 1 ? "complete" : activeIndex === 1 ? "active" : "upcoming"
            },
            { label: "Review", state: activeIndex === 2 ? "active" : "upcoming" }
          ]}
        />
      </div>

      <div className="grid gap-8 lg:grid-cols-[320px_1fr]">
        <aside>{left}</aside>
        <section>{right}</section>
      </div>
    </main>
  );
}
