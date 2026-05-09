"use client";

import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useOrionStore } from "@/store/orionStore";

export default function LessonCompletedPage() {
  const router = useRouter();
  const lesson = useOrionStore((state) => state.lesson);

  if (!lesson) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-3xl items-center px-4 py-12 text-center sm:px-6 sm:py-20">
        <Card className="w-full">
          <p className="text-xl font-semibold text-white">No completed lesson yet</p>
          <p className="mt-2 text-slate-400">Start a lesson from home when you are ready to practice.</p>
          <Button className="mt-6" onClick={() => router.push("/home")}>
            Go to home
          </Button>
        </Card>
      </main>
    );
  }

  return (
    <main className="flex min-h-dvh items-center justify-center bg-[#020514] px-4 py-10 text-slate-100 sm:px-6 sm:py-12">
      <Card className="w-full max-w-2xl p-6 text-center sm:p-8">
        <div className="mx-auto grid size-12 place-items-center rounded-full bg-emerald-400 text-2xl font-bold text-slate-950">
          ✓
        </div>
        <p className="mt-5 text-sm font-semibold uppercase tracking-[0.16em] text-emerald-200">
          Lesson complete
        </p>
        <h1 className="mt-6 text-2xl font-semibold leading-tight tracking-tight text-white sm:text-4xl">
          Nice work finishing {lesson.title}
        </h1>

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
          <Button className="w-full sm:w-auto" onClick={() => router.push("/home")}>
            Back to Home
          </Button>
          <span className="hidden text-slate-500 sm:inline" aria-hidden>
            |
          </span>
          <Button className="w-full sm:w-auto" variant="secondary" onClick={() => router.push("/lesson")}>
            Practice again
          </Button>
        </div>
      </Card>
    </main>
  );
}
