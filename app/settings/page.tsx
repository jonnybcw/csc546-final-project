"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";

import { AppShell } from "@/components/orion/app-shell";
import { LogoutButton } from "@/components/orion/logout-button";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { syncOrionStateFromSupabase } from "@/lib/orionSupabaseBootstrap";
import { ORION_STORE_STORAGE_KEY, useOrionStore, waitForOrionStoreHydration } from "@/store/orionStore";
import type { LessonGenerationResponse } from "@/types/orion";
import { createClient as createSupabaseBrowserClient } from "@/utils/supabase/client";

export default function SettingsPage() {
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const summary = useOrionStore((state) => state.summary);
  const targetLanguage = useOrionStore((state) => state.targetLanguage);
  const userFullName = useOrionStore((state) => state.userFullName);
  const addInterest = useOrionStore((state) => state.addInterest);
  const removeInterest = useOrionStore((state) => state.removeInterest);
  const setUserFullName = useOrionStore((state) => state.setUserFullName);
  const setLesson = useOrionStore((state) => state.setLesson);
  const setLessonError = useOrionStore((state) => state.setLessonError);

  const [nameDraft, setNameDraft] = useState({ value: "", dirty: false });
  const [nameError, setNameError] = useState<string | null>(null);
  const [nameMessage, setNameMessage] = useState<string | null>(null);
  const [nameSyncInProgress, setNameSyncInProgress] = useState(false);
  const [interestInput, setInterestInput] = useState("");
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [interestError, setInterestError] = useState<string | null>(null);
  const [interestSyncInProgress, setInterestSyncInProgress] = useState(false);
  const [deleteInProgress, setDeleteInProgress] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      await waitForOrionStoreHydration();
      const state = useOrionStore.getState();
      if (cancelled || !supabase || (state.summary && state.userFullName)) return;

      await syncOrionStateFromSupabase(supabase);
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [supabase]);

  const interests = summary?.interests ?? [];
  const nameInput = nameDraft.dirty ? nameDraft.value : userFullName ?? "";

  const handleSaveName = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextName = nameInput.trim();

    setNameError(null);
    setNameMessage(null);
    setNameSyncInProgress(true);

    try {
      if (!supabase) {
        throw new Error("Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.");
      }

      const {
        data: { user },
        error: userError
      } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) throw new Error("Not authenticated");

      const { error: profileError } = await supabase.from("profiles").upsert(
        {
          user_id: user.id,
          email: user.email,
          full_name: nextName || null,
          updated_at: new Date().toISOString()
        },
        { onConflict: "user_id" }
      );
      if (profileError) throw profileError;

      setUserFullName(nextName || null);
      setNameDraft({ value: nextName, dirty: false });
      setNameMessage(nextName ? "Name saved." : "Name cleared.");
    } catch (error) {
      setNameError(error instanceof Error ? error.message : "Failed to save name.");
    } finally {
      setNameSyncInProgress(false);
    }
  };

  const generateLessonForSummary = async () => {
    const nextSummary = useOrionStore.getState().summary;
    if (!nextSummary) return;

    setInterestError(null);
    setInterestSyncInProgress(true);

    try {
      const response = await fetch("/api/lesson/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          summary: nextSummary,
          progress: useOrionStore.getState().progress,
          targetLanguage: useOrionStore.getState().targetLanguage ?? "Spanish"
        })
      });

      if (!response.ok) {
        const failedBody = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(failedBody?.error ?? "AI lesson generation failed");
      }

      const payload = (await response.json()) as LessonGenerationResponse;
      setLesson(payload.lesson, payload.source);
    } catch (error) {
      const message = error instanceof Error ? error.message : "AI lesson generation failed.";
      setLessonError(message);
      setInterestError(message);
    } finally {
      setInterestSyncInProgress(false);
    }
  };

  const handleAddInterest = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextInterest = interestInput.trim();
    if (!nextInterest) return;

    addInterest(nextInterest);
    setInterestInput("");
    await generateLessonForSummary();
  };

  const handleRemoveInterest = async (interest: string) => {
    removeInterest(interest);
    await generateLessonForSummary();
  };

  const handleDeleteAccount = async () => {
    setDeleteError(null);
    setDeleteInProgress(true);

    try {
      const response = await fetch("/api/account", { method: "DELETE" });
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? "Failed to delete account");
      }

      await supabase?.auth.signOut();
      localStorage.removeItem(ORION_STORE_STORAGE_KEY);
      router.push("/");
      router.refresh();
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : "Failed to delete account");
      setDeleteInProgress(false);
    }
  };

  return (
    <AppShell active="settings">
      <section className="px-6 py-8 sm:px-10 lg:px-12">
        <header className="mb-10">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-300">Settings</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Manage your Orion account
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
            Review the interests Orion uses for personalization and manage account access.
          </p>
        </header>

        <div className="grid max-w-4xl gap-6">
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-white">Profile</h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Add your full name if you want Orion to greet you personally on the home page.
            </p>

            <form className="mt-6 flex flex-col gap-3 sm:flex-row" onSubmit={handleSaveName}>
              <input
                className="min-h-12 flex-1 rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-indigo-300/60"
                onChange={(event) => {
                  setNameDraft({ value: event.target.value, dirty: true });
                  setNameMessage(null);
                  setNameError(null);
                }}
                placeholder="Full name"
                type="text"
                value={nameInput}
              />
              <Button disabled={nameSyncInProgress || nameInput.trim() === (userFullName ?? "")} type="submit">
                {nameSyncInProgress ? "Saving..." : "Save name"}
              </Button>
            </form>

            {nameMessage && <p className="mt-3 text-sm text-emerald-200">{nameMessage}</p>}
            {nameError && <p className="mt-3 text-sm text-rose-200">{nameError}</p>}
          </Card>

          <Card className="p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-white">Interests</h2>
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  These topics help Orion create lessons around conversations and vocabulary that matter to you.
                </p>
              </div>
              {targetLanguage && <Chip>{targetLanguage}</Chip>}
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              {interests.length > 0 ? (
                interests.map((interest) => (
                  <button
                    key={interest}
                    className="inline-flex items-center gap-2 rounded-full border border-indigo-300/20 bg-indigo-500/10 px-3 py-1.5 text-sm text-indigo-100 transition hover:bg-indigo-500/20"
                    disabled={interestSyncInProgress}
                    onClick={() => void handleRemoveInterest(interest)}
                    type="button"
                  >
                    {interest}
                    <span className="text-indigo-200/70" aria-hidden>
                      x
                    </span>
                  </button>
                ))
              ) : (
                <p className="text-sm text-slate-400">No interests found yet. Add a topic to personalize future lessons.</p>
              )}
            </div>

            <form className="mt-6 flex flex-col gap-3 sm:flex-row" onSubmit={handleAddInterest}>
              <input
                className="min-h-12 flex-1 rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-indigo-300/60"
                onChange={(event) => setInterestInput(event.target.value)}
                placeholder="Add an interest, like cooking or software design"
                value={interestInput}
              />
              <Button disabled={!interestInput.trim() || interestSyncInProgress} type="submit">
                {interestSyncInProgress ? "Updating..." : "Add interest"}
              </Button>
            </form>

            {interestError && <p className="mt-3 text-sm text-rose-200">{interestError}</p>}
            {interestSyncInProgress && !interestError && (
              <p className="mt-3 text-sm text-slate-400">Regenerating your lesson with updated interests...</p>
            )}
          </Card>

          <Card className="p-6">
            <h2 className="text-xl font-semibold text-white">Logout</h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              End your current session on this device. Your lessons and progress remain linked to your account.
            </p>
            <LogoutButton className="mt-5" />
          </Card>

          <Card className="border-rose-400/25 bg-[linear-gradient(180deg,rgba(76,5,25,0.72),rgba(28,10,24,0.9))] p-6">
            <h2 className="text-xl font-semibold text-rose-100">Delete account</h2>
            <p className="mt-2 text-sm leading-6 text-rose-100/75">
              Permanently delete your Orion account, profile, context, generated lessons, and progress events.
              Type DELETE to confirm.
            </p>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <input
                className="min-h-12 flex-1 rounded-xl border border-rose-200/20 bg-black/20 px-4 text-sm text-white outline-none transition placeholder:text-rose-100/35 focus:border-rose-200/60"
                onChange={(event) => setDeleteConfirmation(event.target.value)}
                placeholder="DELETE"
                value={deleteConfirmation}
              />
              <Button
                variant="secondary"
                className="border-rose-200/25 bg-rose-500 text-white shadow-[0_0_24px_rgba(244,63,94,0.25)] hover:bg-rose-400"
                disabled={deleteConfirmation !== "DELETE" || deleteInProgress}
                onClick={handleDeleteAccount}
                type="button"
              >
                {deleteInProgress ? "Deleting..." : "Delete account"}
              </Button>
            </div>

            {deleteError && <p className="mt-3 text-sm text-rose-100">{deleteError}</p>}
          </Card>
        </div>
      </section>
    </AppShell>
  );
}
