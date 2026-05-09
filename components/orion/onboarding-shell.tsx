import Link from "next/link";
import type { ReactNode } from "react";

import { LogoutButton } from "@/components/orion/logout-button";
import { OrionLogo } from "@/components/orion/orion-logo";
import { ProgressStepper } from "@/components/ui/progress-stepper";

interface OnboardingShellProps {
  step: "language" | "upload" | "processing" | "review";
  left: ReactNode;
  right: ReactNode;
}

const STEP_ORDER = ["language", "upload", "processing", "review"] as const;

export function OnboardingShell({ step, left, right }: OnboardingShellProps) {
  const activeIndex = STEP_ORDER.indexOf(step);

  return (
    <main className="mx-auto max-w-7xl px-6 py-8">
      <header className="mb-8 flex items-center justify-between">
        <OrionLogo priority className="w-36" />
        <div className="flex items-center gap-3">
          <Link href="/#faq" className="text-sm text-slate-300 hover:text-white">
            Need help?
          </Link>
          <LogoutButton />
        </div>
      </header>

      <div className="mb-10">
        <ProgressStepper
          steps={[
            { label: "Language", state: activeIndex > 0 ? "complete" : activeIndex === 0 ? "active" : "upcoming" },
            {
              label: "Upload",
              state: activeIndex > 1 ? "complete" : activeIndex === 1 ? "active" : "upcoming"
            },
            {
              label: "Processing",
              state: activeIndex > 2 ? "complete" : activeIndex === 2 ? "active" : "upcoming"
            },
            { label: "Review", state: activeIndex === 3 ? "active" : "upcoming" }
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
