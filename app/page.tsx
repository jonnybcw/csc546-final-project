import Link from "next/link";

import { OrionLogo } from "@/components/orion/orion-logo";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";

const startHref = "/login?next=/language";

export default function LandingPage() {
  return (
    <main className="min-h-screen text-slate-100">
      <div className="mx-auto max-w-6xl px-5 pb-16 pt-8 md:px-8">
        <header className="mb-12 flex flex-col gap-6 sm:mb-16 md:flex-row md:items-center md:justify-between">
          <OrionLogo priority className="w-40" />
          <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-slate-400">
            <a className="hover:text-white" href="#how">
              How it works
            </a>
            <a className="hover:text-white" href="#features">
              Features
            </a>
            <a className="hover:text-white" href="#for-who">
              For who?
            </a>
            <a className="hover:text-white" href="#privacy">
              Privacy
            </a>
            <a className="hover:text-white" href="#faq">
              FAQ
            </a>
          </nav>
          <div className="flex items-center justify-center gap-3 md:justify-end">
            <Link className="text-sm text-slate-300 hover:text-white" href="/login">
              Log in
            </Link>
            <Link href={startHref}>
              <Button className="whitespace-nowrap px-5">Get Started</Button>
            </Link>
          </div>
        </header>

        <section className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div className="order-2 lg:order-1">
            <h1 className="text-4xl font-semibold leading-[1.12] tracking-tight sm:text-5xl">
              Learn languages through{" "}
              <span className="bg-gradient-to-r from-violet-400 to-sky-400 bg-clip-text text-transparent">
                your world.
              </span>
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-slate-400 sm:text-lg">
              Orion turns your real conversations and interests into personalized daily lessons—so you
              practice what actually matters to you.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link href={startHref}>
                <Button className="px-7 py-3.5 text-base">Get Started — It&apos;s free</Button>
              </Link>
              <a
                className="inline-flex items-center gap-2 text-sm font-medium text-violet-300/90 hover:text-violet-200"
                href="#how"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full border border-white/15 bg-white/5">
                  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor" aria-hidden>
                    <title>Play</title>
                    <path d="M8 5v14l11-7L8 5z" />
                  </svg>
                </span>
                See how it works
              </a>
            </div>
            <div className="mt-8 flex items-center gap-3 text-sm text-slate-500">
              <div className="flex -space-x-2" aria-hidden>
                {["bg-violet-500", "bg-sky-500", "bg-amber-500"].map((c) => (
                  <span key={c} className={`inline-block h-8 w-8 rounded-full border-2 border-[#040817] ${c}`} />
                ))}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-amber-400" aria-hidden>
                  ★★★★★
                </span>
                <span>Loved by learners worldwide</span>
              </div>
            </div>
          </div>

          <div className="order-1 lg:order-2">
            <Card className="relative overflow-hidden p-6 sm:p-7">
              <div className="absolute right-0 top-0 h-32 w-32 rounded-full bg-indigo-500/10 blur-3xl" aria-hidden />
              <div className="relative">
                <div className="mb-5 flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-slate-300">Today&apos;s Lesson</p>
                  <Chip className="gap-1.5 border-orange-500/20 bg-orange-500/10 text-orange-200">
                    <span aria-hidden>🔥</span>
                    <span>12 day streak</span>
                  </Chip>
                </div>
                <div className="mb-5 flex gap-1" aria-hidden>
                  {[0, 1, 2, 3, 4].map((i) => (
                    <span
                      key={i}
                      className={`h-1.5 flex-1 rounded-full ${
                        i === 0 ? "bg-gradient-to-r from-violet-500 to-indigo-500" : "bg-white/10"
                      }`}
                    />
                  ))}
                </div>
                <p className="text-lg font-semibold text-white sm:text-xl">Translate this sentence</p>
                <p className="mt-1 text-sm text-slate-400">Based on your interest in coding</p>
                <div className="mt-4 rounded-xl border border-indigo-400/25 bg-indigo-500/5 px-4 py-3 text-sm leading-relaxed text-slate-200">
                  I finished my coding project late last night.
                </div>
                <p className="mt-4 text-xs text-slate-500">
                  Example preview — start a lesson in the app after you sign in.
                </p>
                <div className="mt-3 rounded-xl border border-dashed border-white/15 bg-white/[0.03] px-4 py-3 text-sm text-slate-500">
                  Your translation appears here
                </div>
              </div>
            </Card>
          </div>
        </section>

        <section id="how" className="mt-24 scroll-mt-24 md:mt-32">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-400">How Orion works</p>
          <h2 className="mt-2 text-2xl font-semibold sm:text-3xl">Personalized lessons in 3 simple steps</h2>
          <div className="mt-10 grid gap-6 md:grid-cols-3 md:gap-4">
            {[
              {
                title: "Import your context",
                body: "Upload your ChatGPT or Gemini export (JSON or CSV).",
                icon: (
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <title>Import</title>
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="1.5"
                      d="M12 16V4m0 0 3 3m-3-3-3 3M4 20h16"
                    />
                  </svg>
                )
              },
              {
                title: "We analyze your interests",
                body: "We find topics, vocabulary level, and patterns that matter to you.",
                icon: (
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <title>Analysis</title>
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="1.5"
                      d="M9.5 11a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5Zm0 0c-2 2.8-4 5.2-9 5.2V20h18v-3.8c-5 0-7-2.4-9-5.2Z"
                    />
                  </svg>
                )
              },
              {
                title: "Get daily personalized lessons",
                body: "Learn with lessons built around your world, every day.",
                icon: (
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <title>Lessons</title>
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="1.5"
                      d="M4 7h16M4 12h16M4 17h10"
                    />
                  </svg>
                )
              }
            ].map((step, i) => (
              <div key={step.title} className="relative">
                {i < 2 && (
                  <div
                    className="absolute right-0 top-10 hidden h-px w-[calc(50%+0.5rem)] translate-x-1/2 bg-gradient-to-r from-white/20 to-transparent md:block"
                    aria-hidden
                  />
                )}
                <Card className="h-full space-y-3 p-5">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-500/15 text-violet-300">
                    {step.icon}
                  </div>
                  <p className="text-lg font-semibold">{step.title}</p>
                  <p className="text-sm leading-relaxed text-slate-400">{step.body}</p>
                </Card>
              </div>
            ))}
          </div>
        </section>

        <section id="for-who" className="mt-24 scroll-mt-24 md:mt-32">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-400">Who it&apos;s for</p>
          <h2 className="mt-2 text-2xl font-semibold sm:text-3xl">Designed for learners who already know the basics</h2>
          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <Card className="border-emerald-500/20 bg-emerald-500/[0.04] p-6">
              <p className="text-lg font-semibold text-emerald-100">Orion is for you if you…</p>
              <ul className="mt-4 space-y-3 text-sm text-slate-300">
                {[
                  "Have studied a language before",
                  "Want to become more fluent",
                  "Use AI tools",
                  "Are tired of generic lessons"
                ].map((item) => (
                  <li key={item} className="flex gap-2">
                    <span className="mt-0.5 text-emerald-400" aria-hidden>
                      ✓
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </Card>
            <Card className="border-rose-500/20 bg-rose-500/[0.04] p-6">
              <p className="text-lg font-semibold text-rose-100">Orion is not for you if you…</p>
              <ul className="mt-4 space-y-3 text-sm text-slate-300">
                {["Are a complete beginner", "Need a structured step-by-step language course from scratch"].map(
                  (item) => (
                    <li key={item} className="flex gap-2">
                      <span className="mt-0.5 text-rose-400" aria-hidden>
                        ✕
                      </span>
                      <span>{item}</span>
                    </li>
                  )
                )}
              </ul>
            </Card>
          </div>
        </section>

        <section id="features" className="mt-24 scroll-mt-24 md:mt-32">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-400">Features</p>
          <h2 className="mt-2 text-2xl font-semibold sm:text-3xl">Built around your real life</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["Personalized to you", "Lessons are built from your real conversations."],
              ["Effortless daily learning", "Short, focused lessons you can finish in minutes."],
              ["More engaging", "Practice language you will actually use day to day."],
              ["Privacy-first", "You control what is imported and can edit it anytime."]
            ].map(([title, text]) => (
              <Card key={title} className="p-5">
                <p className="font-semibold text-white">{title}</p>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">{text}</p>
              </Card>
            ))}
          </div>
        </section>

        <section id="privacy" className="mt-24 scroll-mt-24 md:mt-32">
          <Card className="border-sky-500/15 bg-sky-500/[0.04] p-6 sm:p-8">
            <h2 className="text-xl font-semibold sm:text-2xl">Your data, your control</h2>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-400">
              You choose what to upload. Data is used only to generate personalized lessons, and you can
              edit or remove topics anytime.
            </p>
          </Card>
        </section>

        <section id="faq" className="mt-24 scroll-mt-24 md:mt-32">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-400">FAQ</p>
          <h2 className="mt-2 text-2xl font-semibold sm:text-3xl">Common questions</h2>
          <div className="mt-8 space-y-3">
            {[
              {
                q: "What should I upload?",
                a: "A JSON or CSV export from ChatGPT or Gemini. Orion reads your topics and tone to shape lessons—not to store chats indefinitely as a product feature beyond lesson generation."
              },
              {
                q: "Is Orion for beginners?",
                a: "It works best if you already know some basics. It helps you bridge toward fluency using language that matches your interests."
              },
              {
                q: "Do I need an account?",
                a: "Yes. Sign in so your language choice and lesson progress stay with you across sessions."
              }
            ].map(({ q, a }) => (
              <details
                key={q}
                className="group rounded-2xl border border-white/10 bg-white/[0.02] px-5 py-4 open:bg-white/[0.04]"
              >
                <summary className="cursor-pointer list-none text-left font-medium text-slate-200 [&::-webkit-details-marker]:hidden">
                  <span className="flex items-center justify-between gap-3">
                    {q}
                    <span className="text-slate-500 transition group-open:rotate-180" aria-hidden>
                      ▼
                    </span>
                  </span>
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-slate-400">{a}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="mt-24 md:mt-32">
          <Card className="relative overflow-hidden border-indigo-500/20 bg-[linear-gradient(135deg,rgba(30,27,75,0.5),rgba(15,23,42,0.95))] p-8 sm:p-10">
            <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-violet-500/20 blur-3xl" />
            <div className="pointer-events-none absolute bottom-0 left-1/4 h-32 w-64 rounded-full bg-indigo-500/10 blur-2xl" />
            <div className="relative flex flex-col items-start gap-6 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-2xl font-semibold sm:text-3xl">Start learning from your life</h2>
                <p className="mt-2 max-w-xl text-sm text-slate-400 sm:text-base">
                  Import your context and get your first personalized lesson in minutes.
                </p>
              </div>
              <Link href={startHref} className="shrink-0">
                <Button className="inline-flex items-center gap-2 px-6 py-3.5 text-base">
                  Get Started — It&apos;s free
                  <span aria-hidden>→</span>
                </Button>
              </Link>
            </div>
          </Card>
        </section>

        <footer className="mt-20 border-t border-white/10 pt-10 text-sm text-slate-500">
          <div className="flex flex-col gap-10 md:flex-row md:justify-between">
            <div>
              <OrionLogo className="w-36" />
              <p className="mt-2 max-w-xs text-slate-500">Personalized language learning from your own context.</p>
            </div>
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <p className="mb-3 font-medium text-slate-400">Product</p>
                <ul className="space-y-2">
                  <li>
                    <a className="hover:text-slate-300" href="#how">
                      How it works
                    </a>
                  </li>
                  <li>
                    <a className="hover:text-slate-300" href="#features">
                      Features
                    </a>
                  </li>
                  <li>
                    <a className="hover:text-slate-300" href="#for-who">
                      For who?
                    </a>
                  </li>
                </ul>
              </div>
              <div>
                <p className="mb-3 font-medium text-slate-400">Support</p>
                <ul className="space-y-2">
                  <li>
                    <a className="hover:text-slate-300" href="#faq">
                      FAQ
                    </a>
                  </li>
                  <li>
                    <a className="hover:text-slate-300" href="#privacy">
                      Privacy
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>
          <p className="mt-10 text-center text-xs text-slate-600">© {new Date().getFullYear()} Orion. Prototype.</p>
        </footer>
      </div>
    </main>
  );
}
