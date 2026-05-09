"use client";

import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { createClient as createSupabaseBrowserClient } from "@/utils/supabase/client";

export function LoginForm({ nextPath, initialError }: { nextPath: string; initialError?: string | null }) {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(initialError ?? null);

  async function signInWithGoogle() {
    setLoading(true);
    setError(null);
    try {
      if (!supabase) {
        throw new Error("Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.");
      }
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(nextPath)}`,
          queryParams: {
            prompt: "select_account"
          }
        }
      });
      if (oauthError) throw oauthError;
    } catch (signInError) {
      setError(signInError instanceof Error ? signInError.message : "Unable to start Google sign-in");
      setLoading(false);
    } finally {
      // Supabase redirects on success, so keep the loading state until navigation starts.
    }
  }

  return (
    <Card className="w-full space-y-5 p-8">
      <div>
        <p className="text-3xl font-semibold">Sign in to Orion</p>
        <p className="mt-2 text-sm text-slate-300">
          Continue with your Google account. No password required.
        </p>
      </div>

      {error && <p className="rounded-lg bg-rose-500/15 px-3 py-2 text-sm text-rose-100">{error}</p>}

      <div className="flex gap-3">
        <Button className="w-full" disabled={loading} onClick={signInWithGoogle}>
          {loading ? "Redirecting..." : "Continue with Google"}
        </Button>
      </div>
    </Card>
  );
}
