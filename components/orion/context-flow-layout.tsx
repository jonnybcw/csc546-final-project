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
    <div className="relative min-h-screen overflow-hidden pb-28">
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[min(45vh,380px)] bg-[radial-gradient(ellipse_120%_80%_at_50%_100%,rgba(59,130,246,0.12),transparent_55%),radial-gradient(ellipse_90%_60%_at_50%_100%,rgba(99,102,241,0.08),transparent_50%)]"
        aria-hidden
      />

      <main className="relative z-10 mx-auto max-w-3xl px-5 pb-10 pt-8 md:px-8">
        <header className="mb-8 flex items-center justify-between">
          <Link href="/" aria-label="Orion home">
            <OrionLogo priority className="w-36" />
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/#faq"
              className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-200"
            >
              <span aria-hidden className="text-slate-500">
                ?
              </span>
              Need help?
            </Link>
            <LogoutButton className="border-white/15 bg-transparent px-2.5 py-2 text-xs text-slate-400 hover:bg-white/5 md:px-3" />
          </div>
        </header>

        <div className="mb-10 flex justify-center">
          <ContextProgressStepper active={activeStep} />
        </div>

        {children}

        {footer && <div className="mt-10">{footer}</div>}
      </main>
    </div>
  );
}
