"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { OnboardingShell } from "@/components/orion/onboarding-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { useOrionStore } from "@/store/orionStore";
import type { ProficiencyLevel } from "@/types/orion";

const LEVELS: ProficiencyLevel[] = [
  "Beginner",
  "Elementary",
  "Intermediate",
  "Upper Intermediate",
  "Advanced"
];

export default function ReviewPage() {
  const router = useRouter();
  const summary = useOrionStore((state) => state.summary);
  const removeInterest = useOrionStore((state) => state.removeInterest);
  const addInterest = useOrionStore((state) => state.addInterest);
  const setLevel = useOrionStore((state) => state.setLevel);
  const generateLesson = useOrionStore((state) => state.generateLesson);

  const [newInterest, setNewInterest] = useState("");

  const levelIndex = useMemo(() => LEVELS.indexOf(summary?.level ?? "Intermediate"), [summary?.level]);

  if (!summary) {
    return (
      <main className="mx-auto max-w-4xl px-6 py-20 text-center">
        <Card>
          <p>No uploaded context found.</p>
          <Button className="mt-4" onClick={() => router.push("/upload")}>
            Go to upload
          </Button>
        </Card>
      </main>
    );
  }

  return (
    <OnboardingShell
      step="review"
      left={
        <div className="space-y-6">
          <h1 className="text-4xl font-semibold leading-tight">
            Review your <span className="text-indigo-400">learning profile</span>
          </h1>
          <p className="text-slate-300">
            We extracted this information from your conversations. Review and edit anything before we
            create your lessons.
          </p>
          <Card>
            <p className="font-semibold">Your data is private</p>
            <p className="mt-2 text-sm text-slate-400">
              You&apos;re in control. You can edit or remove anything before continuing.
            </p>
          </Card>
        </div>
      }
      right={
        <Card className="space-y-6 p-7">
          <section>
            <div className="mb-3 flex items-center justify-between">
              <p className="text-lg font-semibold">Top interests</p>
              <button
                className="text-sm text-indigo-300"
                onClick={() => {
                  const value = newInterest.trim();
                  if (!value) return;
                  addInterest(value);
                  setNewInterest("");
                }}
              >
                + Add interest
              </button>
            </div>
            <div className="mb-3 flex flex-wrap gap-2">
              {summary.interests.map((interest) => (
                <Chip key={interest} className="pr-2">
                  {interest}
                  <button className="ml-1 rounded-full px-1 hover:bg-white/10" onClick={() => removeInterest(interest)}>
                    x
                  </button>
                </Chip>
              ))}
            </div>
            <input
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm"
              value={newInterest}
              onChange={(event) => setNewInterest(event.target.value)}
              placeholder="Add an interest"
            />
          </section>

          <section>
            <p className="text-lg font-semibold">Detected language level</p>
            <p className="text-sm text-slate-400">Based on vocabulary, grammar and complexity.</p>
            <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
              {LEVELS.map((level, index) => (
                <button
                  key={level}
                  className={`rounded-full px-2 py-1 ${index === levelIndex ? "bg-indigo-500/20 text-indigo-200" : ""}`}
                  onClick={() => setLevel(level)}
                >
                  {level}
                </button>
              ))}
            </div>
          </section>

          <section>
            <p className="mb-3 text-lg font-semibold">Common conversation themes</p>
            <div className="grid gap-3 sm:grid-cols-2">
              {summary.themes.map((theme) => (
                <Card key={theme.name} className="p-4">
                  <p className="font-semibold">{theme.name}</p>
                  <p className="text-sm text-slate-400">{theme.percentage}%</p>
                </Card>
              ))}
            </div>
          </section>

          <section>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-lg font-semibold">Key vocabulary example</p>
              <span className="text-sm text-indigo-300">View more</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {summary.vocabulary.map((item) => (
                <Chip key={item.source}>
                  {item.source} - {item.target}
                </Chip>
              ))}
            </div>
          </section>

          <Card className="border-indigo-200/20">
            <p className="text-sm text-slate-300">
              This information will be used to create personalized lessons that are relevant and engaging.
            </p>
          </Card>

          <div className="flex items-center justify-between pt-2">
            <Button variant="secondary" onClick={() => router.push("/processing")}>
              Back
            </Button>
            <div className="text-right">
              <Button
                onClick={() => {
                  generateLesson();
                  router.push("/home");
                }}
              >
                Generate my lessons
              </Button>
              <p className="mt-1 text-xs text-slate-400">You&apos;ll be taken to your home page next.</p>
            </div>
          </div>
        </Card>
      }
    />
  );
}
