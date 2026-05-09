"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { AppShell } from "@/components/orion/app-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { syncOrionStateFromSupabase } from "@/lib/orionSupabaseBootstrap";
import { useOrionStore, waitForOrionStoreHydration } from "@/store/orionStore";
import { createClient as createSupabaseBrowserClient } from "@/utils/supabase/client";

const STAR_POINTS = Array.from({ length: 46 }, (_, index) => ({
  id: `star-${(index * 47) % 350}-${(index * 31) % 240}`,
  cx: (index * 47) % 350,
  cy: (index * 31) % 240,
  r: index % 5 === 0 ? 1.2 : 0.55,
  opacity: index % 4 === 0 ? 0.75 : 0.35
}));

function getTimeBasedGreeting() {
  const hour = new Date().getHours();

  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function isEvening() {
  return new Date().getHours() >= 17;
}

export default function HomePage() {
  const router = useRouter();
  const summary = useOrionStore((state) => state.summary);
  const lesson = useOrionStore((state) => state.lesson);
  const progress = useOrionStore((state) => state.progress);
  const userFullName = useOrionStore((state) => state.userFullName);

  const [remoteSyncDone, setRemoteSyncDone] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      await waitForOrionStoreHydration();
      if (cancelled) return;

      const hasLocal = useOrionStore.getState().summary && useOrionStore.getState().lesson;
      if (hasLocal) {
        setRemoteSyncDone(true);
        return;
      }

      const supabase = createSupabaseBrowserClient();
      if (supabase) {
        await syncOrionStateFromSupabase(supabase);
      }
      if (!cancelled) setRemoteSyncDone(true);
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, []);

  const activeLesson = lesson;

  if (!remoteSyncDone) {
    return (
      <main className="mx-auto flex min-h-screen max-w-4xl flex-col items-center justify-center px-6 py-20">
        <p className="text-slate-400">Loading your workspace…</p>
      </main>
    );
  }

  if (!summary || !activeLesson) {
    return (
      <main className="mx-auto max-w-4xl px-6 py-20">
        <Card className="text-center">
          <p className="text-xl font-semibold">No lesson available yet</p>
          <p className="mt-2 text-slate-400">
            Generate your lesson from the review step after AI processing completes successfully.
          </p>
          <Button className="mt-6" onClick={() => router.push("/upload")}>
            Go to upload
          </Button>
        </Card>
      </main>
    );
  }

  const firstName = userFullName?.trim().split(/\s+/)[0] ?? "";
  const greeting = getTimeBasedGreeting();
  const greetingIcon = isEvening() ? "🌙" : "☀️";

  return (
    <AppShell active="home">
      <section className="px-6 py-8 sm:px-10 lg:px-12">
        <header className="mb-10 flex items-center justify-between gap-6">
          <div>
            <h1 className="flex items-center gap-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              {greeting}{firstName ? `, ${firstName}!` : ""}
              <span aria-hidden>{greetingIcon}</span>
            </h1>
            <p className="mt-2 text-sm text-slate-300 sm:text-base">Let&apos;s continue your learning journey.</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden items-center gap-2 text-sm text-slate-300 sm:flex">
              <span aria-hidden>🔥</span>
              {progress.streakDays} day streak
            </div>
          </div>
        </header>

        <Card className="relative max-w-3xl overflow-hidden rounded-2xl border-indigo-300/15 bg-[linear-gradient(135deg,rgba(11,16,41,0.96),rgba(7,10,30,0.98))] p-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_82%_15%,rgba(99,102,241,0.2),transparent_24%),radial-gradient(circle_at_88%_82%,rgba(124,58,237,0.22),transparent_34%)]" />
          <div className="absolute right-0 top-0 hidden h-full w-1/2 sm:block" aria-hidden>
            <div className="absolute inset-0 opacity-80">
              <Constellation />
            </div>
            <div className="absolute -bottom-24 right-[-72px] h-56 w-96 rounded-[50%] bg-[radial-gradient(circle_at_38%_15%,rgba(255,255,255,0.55),rgba(124,58,237,0.7)_18%,rgba(40,18,112,0.9)_38%,rgba(7,10,30,0)_62%)] blur-[1px]" />
          </div>

          <div className="relative p-7 sm:p-9">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-violet-300">Today&apos;s lesson</p>
            <h2 className="mt-5 max-w-md text-3xl font-semibold leading-tight text-white sm:text-4xl">
              {activeLesson.title}
            </h2>
            <p className="mt-5 max-w-sm text-sm leading-7 text-slate-300">{activeLesson.description}</p>

            <div className="mt-10 flex flex-col gap-5 sm:flex-row sm:items-center">
              <Button className="inline-flex w-full items-center justify-center gap-6 px-7 py-4 text-base sm:w-auto" onClick={() => router.push("/lesson")}>
                Start Lesson
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15" aria-hidden>
                  <PlayIcon />
                </span>
              </Button>

              <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-slate-300">
                <span className="inline-flex items-center gap-2">
                  <ClockIcon />
                  {activeLesson.durationMinutes}-{activeLesson.durationMinutes + 5} min
                </span>
                <span className="inline-flex items-center gap-2">
                  <LevelIcon />
                  {activeLesson.difficulty}
                </span>
              </div>
            </div>
          </div>
        </Card>
      </section>
    </AppShell>
  );
}

function PlayIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <title>Play</title>
      <path d="M8 5.2v13.6L18.8 12 8 5.2Z" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg className="h-5 w-5 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
      <title>Duration</title>
      <circle cx="12" cy="12" r="8.5" strokeWidth="1.6" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6" d="M12 7.5V12l3 2" />
    </svg>
  );
}

function LevelIcon() {
  return (
    <svg className="h-5 w-5 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
      <title>Difficulty</title>
      <path strokeLinecap="round" strokeWidth="1.6" d="M6 18V9m6 9V6m6 12v-6" />
    </svg>
  );
}

function Constellation() {
  return (
    <svg className="h-full w-full" viewBox="0 0 360 260" fill="none" aria-hidden>
      <title>Constellation background</title>
      <g opacity="0.45">
        {STAR_POINTS.map((star) => (
          <circle key={star.id} cx={star.cx} cy={star.cy} r={star.r} fill="white" opacity={star.opacity} />
        ))}
      </g>
      <path d="M144 90 191 48l58 63-38 44-67-65Z" stroke="#8b8cff" strokeWidth="1.2" opacity="0.55" />
      <path d="M191 48v78l58-15M144 90l-34 34 43 28M211 155l44 45" stroke="#8b8cff" strokeWidth="1" opacity="0.4" />
      {[
        [144, 90],
        [191, 48],
        [249, 111],
        [211, 155],
        [110, 124],
        [153, 152],
        [255, 200]
      ].map(([cx, cy]) => (
        <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="3.2" fill="#f6f3ff" />
      ))}
    </svg>
  );
}
