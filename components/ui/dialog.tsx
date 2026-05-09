"use client";

import { useEffect, useId, type ReactNode } from "react";

import { cn } from "@/lib/cn";

interface DialogProps {
  open: boolean;
  title: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
  onOpenChange: (open: boolean) => void;
}

export function Dialog({
  open,
  title,
  description,
  icon,
  children,
  className,
  onOpenChange
}: DialogProps) {
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    if (!open) return;

    const onDocumentKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onOpenChange(false);
    };

    document.addEventListener("keydown", onDocumentKeyDown);
    return () => document.removeEventListener("keydown", onDocumentKeyDown);
  }, [open, onOpenChange]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-slate-950/75 px-4 backdrop-blur-sm"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onOpenChange(false);
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        className={cn(
          "relative w-full max-w-md overflow-hidden rounded-[28px] border border-violet-300/20 bg-[linear-gradient(180deg,rgba(17,24,50,0.98),rgba(7,13,31,0.98))] p-6 text-center shadow-[0_24px_90px_rgba(0,0,0,0.45)]",
          className
        )}
      >
        <div className="pointer-events-none absolute -right-16 -top-16 size-40 rounded-full bg-violet-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-16 size-44 rounded-full bg-indigo-500/20 blur-3xl" />

        {icon && (
          <div className="relative mx-auto grid size-14 place-items-center rounded-2xl border border-violet-300/25 bg-violet-500/15 text-violet-100 shadow-[0_0_30px_rgba(124,58,237,0.25)]">
            {icon}
          </div>
        )}

        <div className={cn("relative", icon ? "mt-5" : "")}>
          <h2 id={titleId} className="text-2xl font-semibold tracking-tight text-white">
            {title}
          </h2>
          {description && (
            <p id={descriptionId} className="mt-3 text-sm leading-6 text-slate-300">
              {description}
            </p>
          )}
        </div>

        <div className="relative mt-7">{children}</div>
      </div>
    </div>
  );
}
