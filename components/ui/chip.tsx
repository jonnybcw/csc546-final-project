import type { HTMLAttributes } from "react";

import { cn } from "@/lib/cn";

export function Chip({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border border-white/10 bg-indigo-500/10 px-3 py-1 text-xs font-medium text-indigo-100",
        className
      )}
      {...props}
    />
  );
}
