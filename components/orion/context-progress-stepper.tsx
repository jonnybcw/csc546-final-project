import { Fragment } from "react";

import { cn } from "@/lib/cn";

export type ContextFlowStep = "language" | "upload" | "processing" | "review";

const STEPS: { id: ContextFlowStep; label: string }[] = [
  { id: "language", label: "Language" },
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
    <div className="flex w-full min-w-max max-w-lg items-start sm:min-w-0">
      {STEPS.map((step, index) => {
        const isComplete = index < activeIndex;
        const isActive = index === activeIndex;

        return (
          <Fragment key={step.id}>
            {index > 0 && (
              <div
                className={cn(
                  "mx-1.5 mt-4 h-0.5 min-w-4 flex-1 rounded-full sm:mx-2 sm:mt-[18px] sm:min-w-[2rem]",
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
                  "flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-semibold transition-colors sm:h-9 sm:w-9",
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
                  "mt-2 max-w-[4.5rem] text-center text-[11px] font-medium leading-tight sm:max-w-[5.5rem] sm:text-xs",
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
