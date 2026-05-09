import { cn } from "@/lib/cn";

interface Step {
  label: string;
  state: "complete" | "active" | "upcoming";
}

interface ProgressStepperProps {
  steps: Step[];
}

export function ProgressStepper({ steps }: ProgressStepperProps) {
  return (
    <div className="flex min-w-max items-center gap-2 sm:gap-3">
      {steps.map((step, index) => (
        <div key={step.label} className="flex items-center gap-2 sm:gap-3">
          <div
            className={cn(
              "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs",
              step.state === "complete" && "border-violet-400 bg-violet-500/20 text-violet-100",
              step.state === "active" && "border-indigo-300 bg-indigo-500/30 text-white",
              step.state === "upcoming" && "border-white/20 bg-white/5 text-slate-300"
            )}
          >
            {index + 1}
          </div>
          <span className="whitespace-nowrap text-xs text-slate-300">{step.label}</span>
          {index < steps.length - 1 && <div className="h-px w-6 bg-white/15 sm:w-10" />}
        </div>
      ))}
    </div>
  );
}
