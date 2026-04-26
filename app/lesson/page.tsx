"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { evaluateAnswer } from "@/lib/lessonEngine";
import { useOrionStore } from "@/store/orionStore";

export default function LessonPage() {
  const router = useRouter();
  const lesson = useOrionStore((state) => state.lesson);
  const submitExerciseResult = useOrionStore((state) => state.submitExerciseResult);

  const [exerciseIndex, setExerciseIndex] = useState(0);
  const [input, setInput] = useState("");
  const [feedback, setFeedback] = useState<"idle" | "correct" | "incorrect">("idle");

  if (!lesson) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-20 text-center">
        <Card>
          <p>No lesson generated yet.</p>
          <Button className="mt-4" onClick={() => router.push("/home")}>
            Go to home
          </Button>
        </Card>
      </main>
    );
  }

  const exercise = lesson.exercises[exerciseIndex];
  const totalSteps = lesson.exercises.length;
  const progressWidth = `${((exerciseIndex + 1) / totalSteps) * 100}%`;
  const isLast = exerciseIndex === totalSteps - 1;

  const feedbackStyle = (() => {
    if (feedback === "correct") return "border-emerald-300/60 bg-emerald-500/10";
    if (feedback === "incorrect") return "border-rose-300/70 bg-rose-500/10";
    return "border-white/10 bg-white/5";
  })();

  function checkAnswer(): boolean {
    const correct = evaluateAnswer(input, exercise.answer);
    setFeedback(correct ? "correct" : "incorrect");
    submitExerciseResult(correct);
    return correct;
  }

  return (
    <main className="mx-auto max-w-4xl px-6 py-6">
      <header className="mb-6 flex items-center justify-between">
        <button className="text-xl text-slate-300" onClick={() => router.push("/home")}>
          x Orion
        </button>
        <p className="text-sm text-amber-200">12 day streak</p>
      </header>

      <div className="mb-2 text-center text-sm text-slate-300">
        Step {exerciseIndex + 1} of {totalSteps}
      </div>
      <div className="mx-auto mb-8 h-2 max-w-md overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-indigo-400" style={{ width: progressWidth }} />
      </div>

      <Card className="space-y-6 p-8">
        <p className="w-fit rounded-full bg-indigo-500/20 px-3 py-1 text-sm text-indigo-200">
          {exercise.type === "translate" ? "Translate" : exercise.type === "fill_blank" ? "Fill in the blank" : "Vocabulary"}
        </p>
        <div>
          <h1 className="text-5xl font-semibold">Translate this sentence</h1>
          <p className="mt-3 text-slate-300">Use the words you&apos;ve learned to answer in Spanish.</p>
        </div>

        <Card className="border-indigo-300/20 p-4 text-xl">{exercise.prompt}</Card>

        <textarea
          className={`h-48 w-full rounded-2xl border p-4 text-lg outline-none transition ${feedbackStyle}`}
          placeholder="Type your answer in Spanish..."
          value={input}
          onChange={(event) => setInput(event.target.value)}
        />

        <button className="text-sm text-indigo-300">Need a hint?</button>

        <div className="flex items-center justify-between">
          <Button
            variant="secondary"
            onClick={() => {
              setFeedback("idle");
              setInput("");
              setExerciseIndex((index) => Math.max(0, index - 1));
            }}
          >
            Previous
          </Button>

          <Button
            onClick={() => {
              const correct = checkAnswer();
              if (correct && !isLast) {
                setExerciseIndex((index) => index + 1);
                setFeedback("idle");
                setInput("");
              } else if (correct && isLast) {
                router.push("/home");
              }
            }}
          >
            {isLast ? "Finish Lesson" : "Check Answer"}
          </Button>
        </div>

        <Card className="border-indigo-200/20 p-4 text-sm text-slate-300">Tip: {exercise.hint}</Card>
        {feedback === "incorrect" && (
          <p className="text-sm text-rose-300">Not quite. Review the hint and try one more time.</p>
        )}
        {feedback === "correct" && <p className="text-sm text-emerald-300">Correct! Great work.</p>}
      </Card>
    </main>
  );
}
