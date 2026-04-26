import type { ProcessingStep } from "@/types/orion";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/cn";

interface ProcessingTimelineProps {
  steps: ProcessingStep[];
}

export function ProcessingTimeline({ steps }: ProcessingTimelineProps) {
  return (
    <Card className="space-y-4">
      {steps.map((step, index) => (
        <div key={step.id} className="flex items-start gap-3">
          <div className="flex flex-col items-center">
            <div
              className={cn(
                "mt-1 h-4 w-4 rounded-full border",
                step.status === "Completed" && "border-violet-300 bg-violet-500",
                step.status === "In progress" && "animate-pulse border-indigo-200 bg-indigo-400",
                step.status === "Pending" && "border-white/30 bg-transparent"
              )}
            />
            {index < steps.length - 1 && <div className="mt-1 h-10 w-px bg-white/20" />}
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-white">{step.title}</p>
              <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] text-slate-300">
                {step.status}
              </span>
            </div>
            <p className="text-xs text-slate-400">{step.detail}</p>
          </div>
        </div>
      ))}
    </Card>
  );
}
