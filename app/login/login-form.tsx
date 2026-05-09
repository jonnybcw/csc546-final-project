"use client";

import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { createClient as createSupabaseBrowserClient } from "@/utils/supabase/client";

export function LoginForm({ nextPath, initialError }: { nextPath: string; initialError?: string | null }) {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(initialError ?? null);

  async function requestCode() {
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      if (!supabase) {
        throw new Error("Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.");
      }
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent(nextPath)}`
        }
      });
      if (otpError) throw otpError;

      setMessage("Magic link sent. Check your email and click the link to continue.");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to send magic link");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="w-full space-y-5 p-8">
      <div>
        <p className="text-3xl font-semibold">Sign in to Orion</p>
        <p className="mt-2 text-sm text-slate-300">
          We&apos;ll send a magic login link to your email. No password required.
        </p>
      </div>

      <label className="block">
        <span className="mb-2 block text-sm text-slate-300">Email</span>
        <input
          type="email"
          className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 outline-none"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
        />
      </label>

      {message && <p className="rounded-lg bg-emerald-500/15 px-3 py-2 text-sm text-emerald-100">{message}</p>}
      {error && <p className="rounded-lg bg-rose-500/15 px-3 py-2 text-sm text-rose-100">{error}</p>}

      <div className="flex gap-3">
        <Button className="w-full" disabled={loading || !email} onClick={requestCode}>
          {loading ? "Sending..." : "Send magic link"}
        </Button>
      </div>
    </Card>
  );
}
