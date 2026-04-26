"use client";

import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useOrionStore } from "@/store/orionStore";

const NAV_ITEMS = ["Home", "Lessons", "Progress", "Vocabulary", "Insights", "Settings"];
const DAYS = ["M", "T", "W", "T", "F", "S", "S"];

export default function HomePage() {
  const router = useRouter();
  const summary = useOrionStore((state) => state.summary);
  const lesson = useOrionStore((state) => state.lesson);
  const progress = useOrionStore((state) => state.progress);
  const generateLesson = useOrionStore((state) => state.generateLesson);

  const activeLesson = lesson ?? (summary ? (generateLesson(), useOrionStore.getState().lesson) : null);

  if (!summary || !activeLesson) {
    return (
      <main className="mx-auto max-w-4xl px-6 py-20">
        <Card className="text-center">
          <p className="text-xl font-semibold">Start by uploading your context</p>
          <p className="mt-2 text-slate-400">We need your data to generate personalized lessons.</p>
          <Button className="mt-6" onClick={() => router.push("/upload")}>
            Go to upload
          </Button>
        </Card>
      </main>
    );
  }

  return (
    <main className="mx-auto grid min-h-screen max-w-7xl gap-6 px-5 py-6 lg:grid-cols-[230px_1fr]">
      <aside className="glass-card rounded-2xl p-4">
        <div className="mb-8 text-2xl font-semibold">Orion</div>
        <nav className="space-y-2">
          {NAV_ITEMS.map((item, idx) => (
            <div
              key={item}
              className={`rounded-xl px-3 py-2 text-sm ${
                idx === 0 ? "bg-indigo-500/20 text-indigo-100" : "text-slate-300"
              }`}
            >
              {item}
            </div>
          ))}
        </nav>

        <Card className="mt-10">
          <p className="text-sm text-slate-300">Go further with Orion Premium</p>
          <Button className="mt-3 w-full">Upgrade now</Button>
        </Card>
      </aside>

      <section>
        <header className="mb-5 flex items-center justify-between">
          <div>
            <p className="text-4xl font-semibold">Good evening, Alex!</p>
            <p className="text-slate-300">Let&apos;s continue your learning journey.</p>
          </div>
          <div className="text-sm text-amber-200">12 day streak</div>
        </header>

        <Card className="mb-6 grid gap-4 lg:grid-cols-[1fr_220px]">
          <div>
            <p className="text-sm text-indigo-300">TODAY&apos;S LESSON</p>
            <h2 className="mt-1 text-4xl font-semibold">{activeLesson.title}</h2>
            <p className="mt-3 max-w-xl text-slate-300">{activeLesson.description}</p>
            <div className="mt-6 flex items-center gap-4">
              <Button onClick={() => router.push("/lesson")}>Start Lesson</Button>
              <span className="text-sm text-slate-400">{activeLesson.durationMinutes}-20 min</span>
              <span className="text-sm text-slate-400">{activeLesson.difficulty}</span>
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-indigo-500/5 p-4">
            <p className="text-sm text-slate-300">Focus</p>
            <p className="mt-2 text-lg font-semibold text-indigo-200">{activeLesson.focus}</p>
          </div>
        </Card>

        <p className="mb-3 text-2xl font-semibold">Your progress this week</p>
        <div className="mb-6 grid gap-3 md:grid-cols-4">
          <Card>
            <p className="text-3xl font-semibold">{progress.weeklyGoalCompletion}%</p>
            <p className="text-sm text-slate-400">Weekly Goal</p>
          </Card>
          <Card>
            <p className="text-3xl font-semibold">{progress.wordsLearned}</p>
            <p className="text-sm text-slate-400">New Words</p>
          </Card>
          <Card>
            <p className="text-3xl font-semibold">
              {Math.floor(progress.timeLearnedMinutes / 60)}h {progress.timeLearnedMinutes % 60}m
            </p>
            <p className="text-sm text-slate-400">Time Learned</p>
          </Card>
          <Card>
            <p className="text-3xl font-semibold">{progress.accuracyRate}%</p>
            <p className="text-sm text-slate-400">Accuracy</p>
          </Card>
        </div>

        <Card className="flex items-center justify-between">
          <div>
            <p className="font-semibold">Consistency is key!</p>
            <p className="text-sm text-slate-400">Small progress every day leads to big results.</p>
          </div>
          <div className="flex gap-2">
            {DAYS.map((day, index) => (
              <div
                key={`${day}-${index}`}
                className={`flex h-8 w-8 items-center justify-center rounded-full text-xs ${
                  progress.completedDays.includes(index + 1)
                    ? "bg-indigo-500 text-white"
                    : "bg-white/5 text-slate-400"
                }`}
              >
                {day}
              </div>
            ))}
          </div>
        </Card>
      </section>
    </main>
  );
}
