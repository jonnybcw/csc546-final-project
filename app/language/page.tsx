"use client";

import { useRouter } from "next/navigation";

import { ContextFlowLayout } from "@/components/orion/context-flow-layout";
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
    <ContextFlowLayout activeStep="language">
      <div className="rounded-2xl border border-white/[0.08] bg-[linear-gradient(180deg,rgba(15,23,42,0.6),rgba(8,12,28,0.85))] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.45)] sm:p-8">
        <div className="text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-4xl">
            Choose your{" "}
            <span className="bg-gradient-to-r from-violet-400 to-sky-400 bg-clip-text text-transparent">
              target language
            </span>
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-slate-400 sm:text-base">
            Pick the language you want to practice before uploading context. Orion will adapt extraction and lesson
            generation to this choice.
          </p>
        </div>

        <div className="mt-7 grid gap-3 sm:mt-8 sm:grid-cols-2">
          {LANGUAGE_OPTIONS.map((language) => {
            const selected = targetLanguage === language.code;

            return (
              <button
                key={language.code}
                type="button"
                className={`rounded-xl border px-4 py-4 text-left transition ${
                  selected
                    ? "border-indigo-300 bg-indigo-500/15 shadow-[0_0_24px_rgba(99,102,241,0.16)]"
                    : "border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.06]"
                }`}
                onClick={() => setTargetLanguage(language.code)}
              >
                <span className="flex items-start justify-between gap-3">
                  <span>
                    <span className="block font-semibold text-white">{language.code}</span>
                    <span className="mt-1 block text-xs leading-5 text-slate-400">{language.subtitle}</span>
                  </span>
                  {selected && <span className="mt-0.5 text-sm text-indigo-200" aria-hidden>✓</span>}
                </span>
              </button>
            );
          })}
        </div>

        <Card className="mt-6 border-indigo-400/15 bg-indigo-500/[0.04] p-4 sm:p-5">
          <div className="flex flex-col gap-3 min-[420px]:flex-row">
            <span className="text-lg text-violet-300" aria-hidden>
              ✦
            </span>
            <div className="min-w-0 space-y-2">
              <p className="font-semibold text-slate-100">Why this comes first</p>
              <p className="text-sm leading-relaxed text-slate-400">
                We use your selected language to generate better exercises and vocabulary mappings from day one.
              </p>
              {targetLanguage && (
                <p className="text-sm text-slate-300">
                  Selected language: <Chip className="ml-2">{targetLanguage}</Chip>
                </p>
              )}
            </div>
          </div>
        </Card>

        <div className="mt-8 flex flex-col-reverse gap-4 border-t border-white/10 pt-6 sm:mt-10 sm:flex-row sm:items-center sm:justify-between sm:pt-8">
          <Button className="w-full gap-2 sm:w-auto" variant="secondary" onClick={() => router.push("/")}>
            <span aria-hidden>←</span>
            Back
          </Button>
          <div className="flex w-full flex-col items-stretch gap-2 sm:w-auto sm:items-end">
            <Button
              className="w-full gap-2 sm:w-auto sm:min-w-[200px]"
              disabled={!targetLanguage}
              onClick={() => router.push("/upload")}
            >
              Continue to upload
              <span aria-hidden>→</span>
            </Button>
            {!targetLanguage && (
              <p className="text-center text-xs text-slate-500 sm:text-right">Choose a language to continue.</p>
            )}
          </div>
        </div>
      </div>
    </ContextFlowLayout>
  );
}
