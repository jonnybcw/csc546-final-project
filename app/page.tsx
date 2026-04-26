import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";

export default function LandingPage() {
  return (
    <main className="mx-auto max-w-7xl px-6 py-10">
      <header className="mb-14 flex items-center justify-between">
        <div className="text-2xl font-bold tracking-tight">Orion</div>
        <nav className="hidden gap-8 text-sm text-slate-300 md:flex">
          <a href="#how">How it works</a>
          <a href="#for-who">For who?</a>
          <a href="#features">Features</a>
          <a href="#privacy">Privacy</a>
        </nav>
        <div className="flex items-center gap-3">
          <Link className="text-sm text-slate-300" href="/home">
            Log in
          </Link>
          <Link href="/upload">
            <Button>Get Started</Button>
          </Link>
        </div>
      </header>

      <section className="grid items-center gap-10 lg:grid-cols-2">
        <div>
          <h1 className="text-5xl font-semibold leading-tight">
            Learn languages <br /> through <span className="text-indigo-400">your world.</span>
          </h1>
          <p className="mt-5 max-w-xl text-lg text-slate-300">
            Orion turns your real conversations and interests into personalized daily lessons, so you
            practice what actually matters to you.
          </p>
          <div className="mt-8 flex items-center gap-4">
            <Link href="/upload">
              <Button className="px-8">Get Started</Button>
            </Link>
            <a className="text-sm text-indigo-200" href="#how">
              See How It Works
            </a>
          </div>
        </div>

        <Card className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-slate-300">Today&apos;s Lesson</p>
            <Chip>12 day streak</Chip>
          </div>
          <h3 className="text-2xl font-semibold">Translate this sentence</h3>
          <p className="mb-4 text-sm text-slate-400">Based on your interest in coding</p>
          <Card className="mb-4 border-indigo-400/20 p-4">
            I finished my coding project late last night.
          </Card>
          <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-slate-400">
            Escribe la traduccion en espanol
          </div>
          <Button className="mt-4 w-full">Check</Button>
        </Card>
      </section>

      <section id="how" className="mt-20">
        <p className="mb-2 text-sm uppercase tracking-[0.22em] text-indigo-300">How Orion works</p>
        <h2 className="text-3xl font-semibold">Personalized lessons in 3 simple steps</h2>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {[
            ["Import your context", "Upload your ChatGPT or Gemini export."],
            ["We analyze your interests", "Find topics, vocabulary level, and patterns."],
            ["Get daily personalized lessons", "Learn with short lessons built around your world."]
          ].map(([title, text], index) => (
            <Card key={title} className="space-y-3">
              <Chip>Step {index + 1}</Chip>
              <p className="text-lg font-semibold">{title}</p>
              <p className="text-sm text-slate-400">{text}</p>
            </Card>
          ))}
        </div>
      </section>

      <section id="for-who" className="mt-20 grid gap-6 lg:grid-cols-2">
        <Card>
          <p className="mb-4 text-2xl font-semibold">Designed for learners who already know the basics</p>
          <p className="mb-4 text-sm text-slate-300">Orion is for you if you:</p>
          <ul className="space-y-2 text-sm text-slate-300">
            <li>Have studied a language before</li>
            <li>Want to become more fluent</li>
            <li>Use AI tools like ChatGPT or Gemini</li>
            <li>Are tired of generic lessons</li>
          </ul>
        </Card>
        <Card>
          <p className="mb-4 text-2xl font-semibold">Not ideal for complete beginners</p>
          <ul className="space-y-2 text-sm text-slate-300">
            <li>Looking for step-by-step grammar from scratch</li>
            <li>Wanting a traditional course syllabus</li>
          </ul>
          <p className="mt-6 text-indigo-200">
            Orion helps you move from knowing a language to using it.
          </p>
        </Card>
      </section>

      <section id="features" className="mt-20 grid gap-4 md:grid-cols-4">
        {[
          ["Personalized to you", "Lessons are built from your real conversations."],
          ["Effortless daily learning", "Short, focused lessons completed in minutes."],
          ["More engaging", "Practice language you will actually use in real life."],
          ["Privacy-first", "You control what data is imported and can edit it anytime."]
        ].map(([title, text]) => (
          <Card key={title}>
            <p className="mb-1 font-semibold">{title}</p>
            <p className="text-sm text-slate-400">{text}</p>
          </Card>
        ))}
      </section>

      <section id="privacy" className="mt-16">
        <Card className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
          <div>
            <p className="text-2xl font-semibold">Your data, your control</p>
            <p className="mt-2 text-sm text-slate-300">
              You choose what to upload. Data is only used to generate personalized lessons, and you
              can edit or remove topics anytime.
            </p>
          </div>
          <Link href="/upload">
            <Button className="px-8">Start learning from your life</Button>
          </Link>
        </Card>
      </section>

      <footer className="mt-14 border-t border-white/10 py-8 text-sm text-slate-400">
        <div className="flex flex-wrap items-center gap-6">
          <span>About Orion</span>
          <span>Privacy</span>
          <span>How it works</span>
          <span>Contact</span>
        </div>
      </footer>
    </main>
  );
}
