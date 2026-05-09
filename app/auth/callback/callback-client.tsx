"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { type EmailOtpType } from "@supabase/supabase-js";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { syncOrionStateFromSupabase } from "@/lib/orionSupabaseBootstrap";
import { getPostLoginDestination, waitForOrionStoreHydration } from "@/store/orionStore";
import { createClient as createSupabaseBrowserClient } from "@/utils/supabase/client";

const SESSION_WAIT_ATTEMPTS = 8;
const SESSION_WAIT_MS = 250;

export function AuthCallbackClient({
  code,
  tokenHash,
  type,
  nextPath
}: {
  code: string | null;
  tokenHash: string | null;
  type: string | null;
  nextPath: string;
}) {
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

    const waitForSession = async () => {
      for (let attempt = 0; attempt < SESSION_WAIT_ATTEMPTS; attempt += 1) {
        const {
          data: { session }
        } = await supabase!.auth.getSession();
        if (session) return true;
        await sleep(SESSION_WAIT_MS);
      }
      return false;
    };

    const run = async () => {
      try {
        if (!supabase) throw new Error("Supabase is not configured.");

        if (code) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) {
            if (exchangeError.message.includes("code verifier")) {
              // Session can still be restored asynchronously in some browser/email handoff paths.
              const hasSession = await waitForSession();
              if (!hasSession) {
                throw new Error(
                  "This login link used PKCE and expired in this browser context. Request a new magic link and open it in the same browser."
                );
              }
            } else {
              throw exchangeError;
            }
          }
        } else if (tokenHash && type) {
          const { error: verifyError } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: type as EmailOtpType
          });
          if (verifyError) throw verifyError;
        } else {
          // Implicit flow may return tokens in URL hash instead of query params.
          const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
          const accessToken = hashParams.get("access_token");
          const refreshToken = hashParams.get("refresh_token");

          if (accessToken && refreshToken) {
            const { error: setSessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken
            });
            if (setSessionError) throw setSessionError;
          } else {
            // In some redirects, session restoration is asynchronous.
            const hasSession = await waitForSession();
            if (!hasSession) {
              throw new Error("Invalid or expired login link. Please request a new magic link.");
            }
          }
        }

        if (mounted) {
          await waitForOrionStoreHydration();
          await syncOrionStateFromSupabase(supabase);
          const destination = getPostLoginDestination(nextPath);
          router.replace(destination);
          router.refresh();
        }
      } catch (callbackError) {
        if (mounted) {
          setError(callbackError instanceof Error ? callbackError.message : "Authentication callback failed.");
        }
      }
    };

    run();
    return () => {
      mounted = false;
    };
  }, [code, nextPath, router, supabase, tokenHash, type]);

  return (
    <Card className="w-full space-y-4 p-8">
      <p className="text-2xl font-semibold">Completing sign in...</p>
      {!error ? (
        <p className="text-sm text-slate-300">Please wait while we verify your magic link.</p>
      ) : (
        <>
          <p className="rounded-lg bg-rose-500/15 px-3 py-2 text-sm text-rose-100">{error}</p>
          <Button onClick={() => router.replace("/login?error=auth_callback_failed")}>
            Back to login
          </Button>
        </>
      )}
    </Card>
  );
}
