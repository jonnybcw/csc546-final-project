import { Fragment } from "react";

import { cn } from "@/lib/cn";

export type ContextFlowStep = "upload" | "processing" | "review";

const STEPS: { id: ContextFlowStep; label: string }[] = [
  { id: "upload", label: "Upload" },
  { id: "processing", label: "Processing" },
  { id: "review", label: "Review" }
];

interface ContextProgressStepperProps {
  active: ContextFlowStep;
}

export function ContextProgressStepper({ active }: ContextProgressStepperProps) {
  const activeIndex = STEPS.findIndex((s) => s.id === active);

  return (
    <div className="flex w-full max-w-lg items-start">
      {STEPS.map((step, index) => {
        const isComplete = index < activeIndex;
        const isActive = index === activeIndex;

        return (
          <Fragment key={step.id}>
            {index > 0 && (
              <div
                className={cn(
                  "mx-2 mt-[18px] h-0.5 min-w-[2rem] flex-1 rounded-full",
                  index <= activeIndex
                    ? "bg-gradient-to-r from-violet-500 to-violet-400/70"
                    : "bg-white/10"
                )}
                aria-hidden
              />
            )}
            <div className="flex shrink-0 flex-col items-center">
              <div
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-full border-2 text-xs font-semibold transition-colors",
                  isComplete && "border-violet-400 bg-violet-500/25 text-violet-100",
                  isActive && !isComplete && "border-violet-400 bg-violet-500/40 text-white shadow-[0_0_20px_rgba(139,92,246,0.35)]",
                  !isComplete && !isActive && "border-white/15 bg-white/[0.04] text-slate-500"
                )}
                aria-current={isActive ? "step" : undefined}
              >
                {isComplete ? "✓" : index + 1}
              </div>
              <span
                className={cn(
                  "mt-2 max-w-[5.5rem] text-center text-xs font-medium",
                  (isActive || isComplete) && "text-slate-100",
                  !isActive && !isComplete && "text-slate-500"
                )}
              >
                {step.label}
              </span>
            </div>
          </Fragment>
        );
      })}
    </div>
  );
}
