"use client";

import { useRouter } from "next/navigation";
import { useMemo } from "react";

import { Button } from "@/components/ui/button";
import { createClient as createSupabaseBrowserClient } from "@/utils/supabase/client";

export function LogoutButton({ className }: { className?: string }) {
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  return (
    <Button
      variant="secondary"
      className={className}
      onClick={async () => {
        if (!supabase) {
          router.push("/");
          return;
        }
        await supabase.auth.signOut();
        router.push("/");
        router.refresh();
      }}
    >
      Log out
    </Button>
  );
}
