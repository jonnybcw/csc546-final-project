"use client";

import { useRouter } from "next/navigation";

import { OnboardingShell } from "@/components/orion/onboarding-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { useOrionStore } from "@/store/orionStore";

const LANGUAGE_OPTIONS = [
  { code: "Spanish", subtitle: "Most requested by Orion users" },
  { code: "French", subtitle: "Great for travel and business" },
  { code: "German", subtitle: "Strong for technical communication" },
  { code: "Portuguese", subtitle: "Useful across LATAM and Europe" },
  { code: "Italian", subtitle: "Ideal for culture and travel" },
  { code: "Japanese", subtitle: "Helpful for global tech contexts" }
];

export default function LanguageSelectionPage() {
  const router = useRouter();
  const targetLanguage = useOrionStore((state) => state.targetLanguage);
  const setTargetLanguage = useOrionStore((state) => state.setTargetLanguage);

  return (
    <OnboardingShell
      step="language"
      left={
        <div className="space-y-6">
          <h1 className="text-4xl font-semibold leading-tight">
            Choose your <span className="text-indigo-400">target language</span>
          </h1>
          <p className="text-slate-300">
            Pick the language you want to practice before uploading context. Orion will adapt extraction
            and lesson generation to this choice.
          </p>
          <Card>
            <p className="font-semibold">Why this comes first</p>
            <p className="mt-2 text-sm text-slate-400">
              We use your selected language to generate better exercises and vocabulary mappings from day one.
            </p>
          </Card>
        </div>
      }
      right={
        <Card className="space-y-5 p-7">
          <div>
            <p className="text-2xl font-semibold">What language are you learning?</p>
            <p className="mt-2 text-sm text-slate-400">You can change this later from settings.</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {LANGUAGE_OPTIONS.map((language) => (
              <button
                key={language.code}
                className={`rounded-xl border px-4 py-4 text-left transition ${
                  targetLanguage === language.code
                    ? "border-indigo-300 bg-indigo-500/15"
                    : "border-white/10 bg-white/5 hover:bg-white/10"
                }`}
                onClick={() => setTargetLanguage(language.code)}
              >
                <p className="font-semibold">{language.code}</p>
                <p className="mt-1 text-xs text-slate-400">{language.subtitle}</p>
              </button>
            ))}
          </div>

          {targetLanguage && (
            <Card className="border-indigo-200/20">
              <p className="text-sm text-slate-300">
                Selected language: <Chip className="ml-2">{targetLanguage}</Chip>
              </p>
            </Card>
          )}

          <div className="flex items-center justify-between pt-2">
            <Button variant="secondary" onClick={() => router.push("/")}>
              Back
            </Button>
            <Button disabled={!targetLanguage} onClick={() => router.push("/upload")}>
              Continue to upload
            </Button>
          </div>
        </Card>
      }
    />
  );
}
