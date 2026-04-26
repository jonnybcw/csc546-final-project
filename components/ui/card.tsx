import type { HTMLAttributes } from "react";

import { cn } from "@/lib/cn";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-white/10 bg-[linear-gradient(180deg,rgba(17,24,56,0.95),rgba(8,12,34,0.95))] p-5 shadow-[0_12px_40px_rgba(0,0,0,0.35)]",
        className
      )}
      {...props}
    />
  );
}
