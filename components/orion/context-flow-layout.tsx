import Link from "next/link";
import type { ReactNode } from "react";

import { LogoutButton } from "@/components/orion/logout-button";
import { OrionLogo } from "@/components/orion/orion-logo";
import { ContextProgressStepper, type ContextFlowStep } from "@/components/orion/context-progress-stepper";

interface ContextFlowLayoutProps {
  activeStep: ContextFlowStep;
  children: ReactNode;
  footer?: ReactNode;
}

export function ContextFlowLayout({ activeStep, children, footer }: ContextFlowLayoutProps) {
  return (
    <div className="relative min-h-screen overflow-hidden pb-20 sm:pb-28">
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[min(45vh,380px)] bg-[radial-gradient(ellipse_120%_80%_at_50%_100%,rgba(59,130,246,0.12),transparent_55%),radial-gradient(ellipse_90%_60%_at_50%_100%,rgba(99,102,241,0.08),transparent_50%)]"
        aria-hidden
      />

      <main className="relative z-10 mx-auto max-w-3xl px-4 pb-8 pt-6 sm:px-5 sm:pb-10 sm:pt-8 md:px-8">
        <header className="mb-7 flex items-center justify-between gap-4 sm:mb-8">
          <Link href="/" aria-label="Orion home">
            <OrionLogo priority className="w-28 sm:w-36" />
          </Link>
          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <Link
              href="/#faq"
              className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 sm:text-sm"
            >
              <span aria-hidden className="text-slate-500">
                ?
              </span>
              Need help?
            </Link>
            <LogoutButton className="border-white/15 bg-transparent px-2.5 py-2 text-xs text-slate-400 hover:bg-white/5 md:px-3" />
          </div>
        </header>

        <div className="-mx-4 mb-8 flex justify-start overflow-x-auto px-4 pb-2 sm:mx-0 sm:mb-10 sm:justify-center sm:overflow-visible sm:px-0 sm:pb-0">
          <ContextProgressStepper active={activeStep} />
        </div>

        {children}

        {footer && <div className="mt-10">{footer}</div>}
      </main>
    </div>
  );
}
