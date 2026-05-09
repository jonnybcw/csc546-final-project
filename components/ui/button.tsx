import type { ButtonHTMLAttributes } from "react";

import { cn } from "@/lib/cn";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost";
}

export function Button({ className, variant = "primary", ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex min-h-11 items-center justify-center rounded-xl px-5 py-3 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#040817] disabled:cursor-not-allowed disabled:opacity-55",
        variant === "primary" &&
          "bg-gradient-to-r from-violet-500 to-indigo-500 text-white shadow-[0_0_24px_rgba(99,102,241,0.45)] hover:opacity-95 disabled:hover:opacity-55",
        variant === "secondary" &&
          "border border-white/20 bg-white/5 text-white hover:bg-white/10 disabled:hover:bg-white/5",
        variant === "ghost" && "bg-transparent text-violet-300 hover:bg-white/5 disabled:hover:bg-transparent",
        className
      )}
      {...props}
    />
  );
}
