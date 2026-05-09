import Image from "next/image";

import { cn } from "@/lib/cn";

interface OrionLogoProps {
  className?: string;
  priority?: boolean;
}

export function OrionLogo({ className, priority = false }: OrionLogoProps) {
  return (
    <Image
      src="/images/orion-logo.png"
      alt="Orion"
      width={260}
      height={80}
      priority={priority}
      unoptimized
      className={cn("h-auto w-36", className)}
    />
  );
}
