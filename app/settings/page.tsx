"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent, ReactNode } from "react";

import { AppShell } from "@/components/orion/app-shell";
import { LogoutButton } from "@/components/orion/logout-button";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { syncOrionStateFromSupabase } from "@/lib/orionSupabaseBootstrap";
import { ORION_STORE_STORAGE_KEY, useOrionStore, waitForOrionStoreHydration } from "@/store/orionStore";
import type {
  ContextSummary,
  LessonGenerationResponse,
  ProficiencyLevel,
  ProgressSnapshot,
  TopicScore,
  VocabularyPair
} from "@/types/orion";
import { createClient as createSupabaseBrowserClient } from "@/utils/supabase/client";

const LEVELS: ProficiencyLevel[] = [
  "Beginner",
  "Elementary",
  "Intermediate",
  "Upper Intermediate",
  "Advanced"
];

type VocabularyFrequencyEntry = {
  word: string;
  count: number;
};

type LessonInputDraft = {
  targetLanguage: string;
  summary: ContextSummary;
  progress: ProgressSnapshot;
  vocabularyFrequency: VocabularyFrequencyEntry[];
};

const textInputClass =
  "min-h-12 rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-indigo-300/60";
const numberInputClass =
  "min-h-12 rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-white outline-none transition focus:border-indigo-300/60";

function cloneSummary(summary: ContextSummary): ContextSummary {
  return {
    ...summary,
    interests: [...summary.interests],
    themes: summary.themes.map((theme) => ({ ...theme })),
    vocabulary: summary.vocabulary.map((item) => ({ ...item })),
    sampleSentences: [...summary.sampleSentences],
    vocabularyFrequency: { ...summary.vocabularyFrequency }
  };
}

function createDraft(
  summary: ContextSummary,
  progress: ProgressSnapshot,
  targetLanguage: string | null
): LessonInputDraft {
  return {
    targetLanguage: targetLanguage ?? "Spanish",
    summary: cloneSummary(summary),
    progress: { ...progress, completedDays: [...progress.completedDays], lessonActivityDates: [...progress.lessonActivityDates] },
    vocabularyFrequency: Object.entries(summary.vocabularyFrequency)
      .map(([word, count]) => ({ word, count }))
      .sort((left, right) => right.count - left.count || left.word.localeCompare(right.word))
  };
}

function buildVocabularyFrequency(entries: VocabularyFrequencyEntry[]): Record<string, number> {
  return entries.reduce<Record<string, number>>((acc, entry) => {
    const word = entry.word.trim();
    if (!word) return acc;
    acc[word] = Math.max(0, Math.round(entry.count));
    return acc;
  }, {});
}

function dedupeStrings(values: string[]): string[] {
  return values.map((value) => value.trim()).filter((value, index, all) => value && all.indexOf(value) === index);
}

function normalizeDraft(draft: LessonInputDraft): LessonInputDraft {
  const vocabularyFrequency = buildVocabularyFrequency(draft.vocabularyFrequency);
  return {
    targetLanguage: draft.targetLanguage.trim() || "Spanish",
    summary: {
      ...draft.summary,
      interests: dedupeStrings(draft.summary.interests),
      themes: draft.summary.themes
        .map((theme) => ({
          name: theme.name.trim(),
          percentage: Math.max(0, Math.min(100, Math.round(theme.percentage)))
        }))
        .filter((theme) => theme.name),
      vocabulary: draft.summary.vocabulary
        .map((item) => ({ source: item.source.trim(), target: item.target.trim() }))
        .filter((item) => item.source && item.target),
      sampleSentences: dedupeStrings(draft.summary.sampleSentences),
      vocabularyFrequency,
      totalEntries: Math.max(0, Math.round(draft.summary.totalEntries))
    },
    progress: {
      streakDays: Math.max(0, Math.round(draft.progress.streakDays)),
      weeklyGoalCompletion: Math.max(0, Math.min(100, Math.round(draft.progress.weeklyGoalCompletion))),
      wordsLearned: Math.max(0, Math.round(draft.progress.wordsLearned)),
      timeLearnedMinutes: Math.max(0, Math.round(draft.progress.timeLearnedMinutes)),
      accuracyRate: Math.max(0, Math.min(100, Math.round(draft.progress.accuracyRate))),
      completedDays: draft.progress.completedDays
        .map((day) => Math.max(1, Math.min(7, Math.round(day))))
        .filter((day, index, all) => all.indexOf(day) === index)
        .sort((left, right) => left - right),
      lessonActivityDates: dedupeStrings(draft.progress.lessonActivityDates)
    },
    vocabularyFrequency: Object.entries(vocabularyFrequency).map(([word, count]) => ({ word, count }))
  };
}

interface EditableListProps<T> {
  title: string;
  description: string;
  addLabel: string;
  emptyMessage: string;
  items: T[];
  disabled: boolean;
  onAdd: () => void;
  onRemove: (index: number) => void;
  renderItem: (item: T, index: number) => ReactNode;
}

function EditableList<T>({
  title,
  description,
  addLabel,
  emptyMessage,
  items,
  disabled,
  onAdd,
  onRemove,
  renderItem
}: EditableListProps<T>) {
  return (
    <section className="border-t border-white/10 pt-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          <p className="mt-1 text-sm leading-6 text-slate-400">{description}</p>
        </div>
        <Button disabled={disabled} onClick={onAdd} type="button" variant="secondary">
          {addLabel}
        </Button>
      </div>

      <div className="mt-4 grid gap-3">
        {items.length > 0 ? (
          items.map((item, index) => (
            <div key={index} className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                <div className="grid flex-1 gap-3 sm:grid-cols-2">{renderItem(item, index)}</div>
                <Button
                  className="shrink-0"
                  disabled={disabled}
                  onClick={() => onRemove(index)}
                  type="button"
                  variant="ghost"
                >
                  Remove
                </Button>
              </div>
            </div>
          ))
        ) : (
          <p className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-slate-400">
            {emptyMessage}
          </p>
        )}
      </div>
    </section>
  );
}

export default function SettingsPage() {
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const summary = useOrionStore((state) => state.summary);
  const progress = useOrionStore((state) => state.progress);
  const targetLanguage = useOrionStore((state) => state.targetLanguage);
  const userFullName = useOrionStore((state) => state.userFullName);
  const setTargetLanguage = useOrionStore((state) => state.setTargetLanguage);
  const setUserFullName = useOrionStore((state) => state.setUserFullName);
  const setSummary = useOrionStore((state) => state.setSummary);
  const setProgress = useOrionStore((state) => state.setProgress);
  const setLesson = useOrionStore((state) => state.setLesson);
  const setLessonError = useOrionStore((state) => state.setLessonError);

  const [nameDraft, setNameDraft] = useState({ value: "", dirty: false });
  const [nameError, setNameError] = useState<string | null>(null);
  const [nameMessage, setNameMessage] = useState<string | null>(null);
  const [nameSyncInProgress, setNameSyncInProgress] = useState(false);
  const [lessonDraft, setLessonDraft] = useState<LessonInputDraft | null>(null);
  const [lessonInputError, setLessonInputError] = useState<string | null>(null);
  const [lessonInputMessage, setLessonInputMessage] = useState<string | null>(null);
  const [lessonInputSyncInProgress, setLessonInputSyncInProgress] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteInProgress, setDeleteInProgress] = useState(false);
  const [accountSyncError, setAccountSyncError] = useState<string | null>(null);
  const [accountSyncInProgress, setAccountSyncInProgress] = useState(false);

  const retryAccountSync = useCallback(async () => {
    setAccountSyncError(null);
    setAccountSyncInProgress(true);

    try {
      await waitForOrionStoreHydration();
      if (!supabase) {
        throw new Error("Account sync is unavailable because Supabase is not configured.");
      }

      const synced = await syncOrionStateFromSupabase(supabase);
      if (!synced) {
        throw new Error("We could not sync your account data. Check your connection and try again.");
      }
    } catch (error) {
      setAccountSyncError(error instanceof Error ? error.message : "We could not sync your account data.");
    } finally {
      setAccountSyncInProgress(false);
    }
  }, [supabase]);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      await waitForOrionStoreHydration();
      const state = useOrionStore.getState();
      if (cancelled || !supabase || (state.summary && state.userFullName)) return;

      setAccountSyncError(null);
      setAccountSyncInProgress(true);
      const synced = await syncOrionStateFromSupabase(supabase);
      if (!cancelled && !synced) {
        setAccountSyncError("We could not sync your account data. Check your connection and try again.");
      }
      if (!cancelled) setAccountSyncInProgress(false);
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [supabase]);

  const nameInput = nameDraft.dirty ? nameDraft.value : userFullName ?? "";
  const storeLessonDraft = useMemo(
    () => (summary ? createDraft(summary, progress, targetLanguage) : null),
    [progress, summary, targetLanguage]
  );
  const activeLessonDraft = lessonDraft ?? storeLessonDraft;

  const updateLessonDraft = (updater: (draft: LessonInputDraft) => LessonInputDraft) => {
    setLessonInputMessage(null);
    setLessonInputError(null);
    setLessonDraft((current) => {
      const draft = current ?? storeLessonDraft;
      return draft ? updater(draft) : current;
    });
  };

  const updateSummaryDraft = (updater: (summary: ContextSummary) => ContextSummary) => {
    updateLessonDraft((draft) => ({ ...draft, summary: updater(draft.summary) }));
  };

  const updateProgressDraft = (field: keyof ProgressSnapshot, value: number | number[] | string[]) => {
    updateLessonDraft((draft) => ({
      ...draft,
      progress: {
        ...draft.progress,
        [field]: value
      }
    }));
  };

  const updateArrayItem = <T,>(items: T[], index: number, item: T): T[] =>
    items.map((current, currentIndex) => (currentIndex === index ? item : current));

  const removeArrayItem = <T,>(items: T[], index: number): T[] =>
    items.filter((_, currentIndex) => currentIndex !== index);

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

  const handleSaveLessonInputs = async () => {
    if (!activeLessonDraft) return;

    const nextDraft = normalizeDraft(activeLessonDraft);
    setLessonDraft(nextDraft);
    setLessonInputError(null);
    setLessonInputMessage(null);
    setLessonInputSyncInProgress(true);

    try {
      setSummary(nextDraft.summary);
      setProgress(nextDraft.progress);
      setTargetLanguage(nextDraft.targetLanguage);

      const response = await fetch("/api/lesson/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          summary: nextDraft.summary,
          progress: nextDraft.progress,
          targetLanguage: nextDraft.targetLanguage
        })
      });

      if (!response.ok) {
        const failedBody = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(failedBody?.error ?? "AI lesson generation failed");
      }

      const payload = (await response.json()) as LessonGenerationResponse;
      setLesson(payload.lesson, payload.source);
      setLessonInputMessage("Lesson inputs saved and your lesson was regenerated.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to save lesson inputs.";
      setLessonError(message);
      setLessonInputError(message);
    } finally {
      setLessonInputSyncInProgress(false);
    }
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
            Review and edit the profile, context, vocabulary, and progress Orion uses to generate lessons.
          </p>
        </header>

        {accountSyncError && (
          <Card className="mb-6 flex flex-col gap-4 border-amber-400/25 bg-amber-500/[0.06] p-5 sm:flex-row sm:items-center sm:justify-between" role="alert">
            <div>
              <p className="font-semibold text-amber-100">Account sync failed</p>
              <p className="mt-1 text-sm leading-6 text-amber-100/75">{accountSyncError}</p>
            </div>
            <Button
              type="button"
              variant="secondary"
              className="shrink-0"
              disabled={accountSyncInProgress}
              onClick={() => void retryAccountSync()}
            >
              {accountSyncInProgress ? "Retrying..." : "Retry sync"}
            </Button>
          </Card>
        )}

        <div className="grid max-w-5xl gap-6">
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-white">Profile</h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Add your full name if you want Orion to greet you personally on the home page.
            </p>

            <form className="mt-6 flex flex-col gap-3 sm:flex-row" onSubmit={handleSaveName}>
              <input
                className={`${textInputClass} flex-1`}
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
                <h2 className="text-xl font-semibold text-white">Lesson inputs</h2>
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  Everything below is sent to the lesson generator. Edit, add, or remove items, then save to regenerate
                  the current lesson.
                </p>
              </div>
              {activeLessonDraft?.targetLanguage && <Chip>{activeLessonDraft.targetLanguage}</Chip>}
            </div>

            {activeLessonDraft ? (
              <div className="mt-6 grid gap-6">
                <section className="grid gap-4 md:grid-cols-3">
                  <label className="grid gap-2 text-sm text-slate-300">
                    Target language
                    <input
                      className={textInputClass}
                      disabled={lessonInputSyncInProgress}
                      onChange={(event) =>
                        updateLessonDraft((draft) => ({ ...draft, targetLanguage: event.target.value }))
                      }
                      placeholder="Spanish"
                      value={activeLessonDraft.targetLanguage}
                    />
                  </label>
                  <label className="grid gap-2 text-sm text-slate-300">
                    Detected level
                    <select
                      className={textInputClass}
                      disabled={lessonInputSyncInProgress}
                      onChange={(event) =>
                        updateSummaryDraft((draftSummary) => ({
                          ...draftSummary,
                          level: event.target.value as ProficiencyLevel
                        }))
                      }
                      value={activeLessonDraft.summary.level}
                    >
                      {LEVELS.map((level) => (
                        <option key={level} value={level}>
                          {level}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="grid gap-2 text-sm text-slate-300">
                    Total entries
                    <input
                      className={numberInputClass}
                      disabled={lessonInputSyncInProgress}
                      min={0}
                      onChange={(event) =>
                        updateSummaryDraft((draftSummary) => ({
                          ...draftSummary,
                          totalEntries: Number(event.target.value)
                        }))
                      }
                      type="number"
                      value={activeLessonDraft.summary.totalEntries}
                    />
                  </label>
                </section>

                <EditableList<string>
                  addLabel="Add interest"
                  description="Topics Orion uses for lesson titles, focus, and personalization."
                  disabled={lessonInputSyncInProgress}
                  emptyMessage="No interests yet."
                  items={activeLessonDraft.summary.interests}
                  onAdd={() =>
                    updateSummaryDraft((draftSummary) => ({
                      ...draftSummary,
                      interests: [...draftSummary.interests, ""]
                    }))
                  }
                  onRemove={(index) =>
                    updateSummaryDraft((draftSummary) => ({
                      ...draftSummary,
                      interests: removeArrayItem(draftSummary.interests, index)
                    }))
                  }
                  renderItem={(interest, index) => (
                    <label className="grid gap-2 text-sm text-slate-300 sm:col-span-2">
                      Interest
                      <input
                        className={textInputClass}
                        disabled={lessonInputSyncInProgress}
                        onChange={(event) =>
                          updateSummaryDraft((draftSummary) => ({
                            ...draftSummary,
                            interests: updateArrayItem(draftSummary.interests, index, event.target.value)
                          }))
                        }
                        placeholder="Cooking"
                        value={interest}
                      />
                    </label>
                  )}
                  title="Interests"
                />

                <EditableList<TopicScore>
                  addLabel="Add theme"
                  description="Weighted conversation themes included in the profile summary."
                  disabled={lessonInputSyncInProgress}
                  emptyMessage="No themes yet."
                  items={activeLessonDraft.summary.themes}
                  onAdd={() =>
                    updateSummaryDraft((draftSummary) => ({
                      ...draftSummary,
                      themes: [...draftSummary.themes, { name: "", percentage: 0 }]
                    }))
                  }
                  onRemove={(index) =>
                    updateSummaryDraft((draftSummary) => ({
                      ...draftSummary,
                      themes: removeArrayItem(draftSummary.themes, index)
                    }))
                  }
                  renderItem={(theme, index) => (
                    <>
                      <label className="grid gap-2 text-sm text-slate-300">
                        Theme
                        <input
                          className={textInputClass}
                          disabled={lessonInputSyncInProgress}
                          onChange={(event) =>
                            updateSummaryDraft((draftSummary) => ({
                              ...draftSummary,
                              themes: updateArrayItem(draftSummary.themes, index, {
                                ...theme,
                                name: event.target.value
                              })
                            }))
                          }
                          placeholder="Work and projects"
                          value={theme.name}
                        />
                      </label>
                      <label className="grid gap-2 text-sm text-slate-300">
                        Percentage
                        <input
                          className={numberInputClass}
                          disabled={lessonInputSyncInProgress}
                          max={100}
                          min={0}
                          onChange={(event) =>
                            updateSummaryDraft((draftSummary) => ({
                              ...draftSummary,
                              themes: updateArrayItem(draftSummary.themes, index, {
                                ...theme,
                                percentage: Number(event.target.value)
                              })
                            }))
                          }
                          type="number"
                          value={theme.percentage}
                        />
                      </label>
                    </>
                  )}
                  title="Themes"
                />

                <EditableList<VocabularyPair>
                  addLabel="Add vocabulary"
                  description="Source and target words used to build vocabulary exercises."
                  disabled={lessonInputSyncInProgress}
                  emptyMessage="No vocabulary pairs yet."
                  items={activeLessonDraft.summary.vocabulary}
                  onAdd={() =>
                    updateSummaryDraft((draftSummary) => ({
                      ...draftSummary,
                      vocabulary: [...draftSummary.vocabulary, { source: "", target: "" }]
                    }))
                  }
                  onRemove={(index) =>
                    updateSummaryDraft((draftSummary) => ({
                      ...draftSummary,
                      vocabulary: removeArrayItem(draftSummary.vocabulary, index)
                    }))
                  }
                  renderItem={(item, index) => (
                    <>
                      <label className="grid gap-2 text-sm text-slate-300">
                        Source
                        <input
                          className={textInputClass}
                          disabled={lessonInputSyncInProgress}
                          onChange={(event) =>
                            updateSummaryDraft((draftSummary) => ({
                              ...draftSummary,
                              vocabulary: updateArrayItem(draftSummary.vocabulary, index, {
                                ...item,
                                source: event.target.value
                              })
                            }))
                          }
                          placeholder="progress"
                          value={item.source}
                        />
                      </label>
                      <label className="grid gap-2 text-sm text-slate-300">
                        Target
                        <input
                          className={textInputClass}
                          disabled={lessonInputSyncInProgress}
                          onChange={(event) =>
                            updateSummaryDraft((draftSummary) => ({
                              ...draftSummary,
                              vocabulary: updateArrayItem(draftSummary.vocabulary, index, {
                                ...item,
                                target: event.target.value
                              })
                            }))
                          }
                          placeholder="progreso"
                          value={item.target}
                        />
                      </label>
                    </>
                  )}
                  title="Vocabulary"
                />

                <EditableList<string>
                  addLabel="Add sentence"
                  description="Representative text used as source material for translation exercises."
                  disabled={lessonInputSyncInProgress}
                  emptyMessage="No sample sentences yet."
                  items={activeLessonDraft.summary.sampleSentences}
                  onAdd={() =>
                    updateSummaryDraft((draftSummary) => ({
                      ...draftSummary,
                      sampleSentences: [...draftSummary.sampleSentences, ""]
                    }))
                  }
                  onRemove={(index) =>
                    updateSummaryDraft((draftSummary) => ({
                      ...draftSummary,
                      sampleSentences: removeArrayItem(draftSummary.sampleSentences, index)
                    }))
                  }
                  renderItem={(sentence, index) => (
                    <label className="grid gap-2 text-sm text-slate-300 sm:col-span-2">
                      Sentence
                      <textarea
                        className="min-h-24 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-indigo-300/60"
                        disabled={lessonInputSyncInProgress}
                        onChange={(event) =>
                          updateSummaryDraft((draftSummary) => ({
                            ...draftSummary,
                            sampleSentences: updateArrayItem(draftSummary.sampleSentences, index, event.target.value)
                          }))
                        }
                        placeholder="I finished my coding project late last night."
                        value={sentence}
                      />
                    </label>
                  )}
                  title="Sample sentences"
                />

                <EditableList<VocabularyFrequencyEntry>
                  addLabel="Add word"
                  description="Word counts included in the context summary sent to the generator."
                  disabled={lessonInputSyncInProgress}
                  emptyMessage="No vocabulary frequencies yet."
                  items={activeLessonDraft.vocabularyFrequency}
                  onAdd={() =>
                    updateLessonDraft((draft) => ({
                      ...draft,
                      vocabularyFrequency: [...draft.vocabularyFrequency, { word: "", count: 1 }]
                    }))
                  }
                  onRemove={(index) =>
                    updateLessonDraft((draft) => ({
                      ...draft,
                      vocabularyFrequency: removeArrayItem(draft.vocabularyFrequency, index)
                    }))
                  }
                  renderItem={(entry, index) => (
                    <>
                      <label className="grid gap-2 text-sm text-slate-300">
                        Word
                        <input
                          className={textInputClass}
                          disabled={lessonInputSyncInProgress}
                          onChange={(event) =>
                            updateLessonDraft((draft) => ({
                              ...draft,
                              vocabularyFrequency: updateArrayItem(draft.vocabularyFrequency, index, {
                                ...entry,
                                word: event.target.value
                              })
                            }))
                          }
                          placeholder="project"
                          value={entry.word}
                        />
                      </label>
                      <label className="grid gap-2 text-sm text-slate-300">
                        Count
                        <input
                          className={numberInputClass}
                          disabled={lessonInputSyncInProgress}
                          min={0}
                          onChange={(event) =>
                            updateLessonDraft((draft) => ({
                              ...draft,
                              vocabularyFrequency: updateArrayItem(draft.vocabularyFrequency, index, {
                                ...entry,
                                count: Number(event.target.value)
                              })
                            }))
                          }
                          type="number"
                          value={entry.count}
                        />
                      </label>
                    </>
                  )}
                  title="Vocabulary frequency"
                />

                <section className="border-t border-white/10 pt-6">
                  <h3 className="text-lg font-semibold text-white">Progress snapshot</h3>
                  <p className="mt-1 text-sm leading-6 text-slate-400">
                    These learning stats are sent with the context so lesson difficulty can adapt to performance.
                  </p>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <label className="grid gap-2 text-sm text-slate-300">
                      Streak days
                      <input
                        className={numberInputClass}
                        disabled={lessonInputSyncInProgress}
                        min={0}
                        onChange={(event) => updateProgressDraft("streakDays", Number(event.target.value))}
                        type="number"
                        value={activeLessonDraft.progress.streakDays}
                      />
                    </label>
                    <label className="grid gap-2 text-sm text-slate-300">
                      Weekly goal completion
                      <input
                        className={numberInputClass}
                        disabled={lessonInputSyncInProgress}
                        max={100}
                        min={0}
                        onChange={(event) => updateProgressDraft("weeklyGoalCompletion", Number(event.target.value))}
                        type="number"
                        value={activeLessonDraft.progress.weeklyGoalCompletion}
                      />
                    </label>
                    <label className="grid gap-2 text-sm text-slate-300">
                      Accuracy rate
                      <input
                        className={numberInputClass}
                        disabled={lessonInputSyncInProgress}
                        max={100}
                        min={0}
                        onChange={(event) => updateProgressDraft("accuracyRate", Number(event.target.value))}
                        type="number"
                        value={activeLessonDraft.progress.accuracyRate}
                      />
                    </label>
                    <label className="grid gap-2 text-sm text-slate-300">
                      Words learned
                      <input
                        className={numberInputClass}
                        disabled={lessonInputSyncInProgress}
                        min={0}
                        onChange={(event) => updateProgressDraft("wordsLearned", Number(event.target.value))}
                        type="number"
                        value={activeLessonDraft.progress.wordsLearned}
                      />
                    </label>
                    <label className="grid gap-2 text-sm text-slate-300">
                      Time learned minutes
                      <input
                        className={numberInputClass}
                        disabled={lessonInputSyncInProgress}
                        min={0}
                        onChange={(event) => updateProgressDraft("timeLearnedMinutes", Number(event.target.value))}
                        type="number"
                        value={activeLessonDraft.progress.timeLearnedMinutes}
                      />
                    </label>
                    <label className="grid gap-2 text-sm text-slate-300">
                      Completed days
                      <input
                        className={textInputClass}
                        disabled={lessonInputSyncInProgress}
                        onChange={(event) =>
                          updateProgressDraft(
                            "completedDays",
                            event.target.value
                              .split(",")
                              .map((value) => Number(value.trim()))
                              .filter((value) => !Number.isNaN(value))
                          )
                        }
                        placeholder="1, 2, 3"
                        value={activeLessonDraft.progress.completedDays.join(", ")}
                      />
                    </label>
                  </div>
                  <label className="mt-4 grid gap-2 text-sm text-slate-300">
                    Lesson activity dates
                    <textarea
                      className="min-h-24 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-indigo-300/60"
                      disabled={lessonInputSyncInProgress}
                      onChange={(event) =>
                        updateProgressDraft(
                          "lessonActivityDates",
                          event.target.value
                            .split("\n")
                            .map((value) => value.trim())
                            .filter(Boolean)
                        )
                      }
                      placeholder="2026-05-08"
                      value={activeLessonDraft.progress.lessonActivityDates.join("\n")}
                    />
                  </label>
                </section>

                <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm leading-6 text-slate-400">
                    Saving updates the local editor state, persists the context JSON in Supabase, and creates a fresh
                    lesson from the edited inputs.
                  </p>
                  <Button disabled={lessonInputSyncInProgress} onClick={() => void handleSaveLessonInputs()} type="button">
                    {lessonInputSyncInProgress ? "Saving..." : "Save and regenerate lesson"}
                  </Button>
                </div>

                {lessonInputMessage && <p className="text-sm text-emerald-200">{lessonInputMessage}</p>}
                {lessonInputError && <p className="text-sm text-rose-200">{lessonInputError}</p>}
              </div>
            ) : (
              <p className="mt-6 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-slate-400">
                No lesson context found yet. Upload conversation context before editing lesson inputs.
              </p>
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
                className="border-rose-200/25 bg-rose-500 text-white shadow-[0_0_24px_rgba(244,63,94,0.25)] hover:bg-rose-400"
                disabled={deleteConfirmation !== "DELETE" || deleteInProgress}
                onClick={handleDeleteAccount}
                type="button"
                variant="secondary"
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
