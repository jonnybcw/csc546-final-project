# Orion

Orion is a personalized language learning app built with Next.js. It turns a learner's real AI conversation history and interests into short daily lessons, so practice is based on topics and language the learner actually uses.

The app is designed for learners who already know the basics of a language and want more relevant practice. Users choose a target language, upload a ChatGPT or Gemini export as JSON or CSV, review the extracted context, and generate lessons with AI.

## Features

- Target language onboarding
- JSON and CSV context upload
- AI-powered interest and vocabulary extraction
- Personalized lesson generation
- Lesson progress and streak tracking
- Supabase-backed authentication and persistence

## Tech Stack

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS
- Zustand
- Supabase
- Gemini or OpenAI-compatible AI APIs
- Vitest

## Prerequisites

- Node.js 20 or newer
- npm
- A Supabase project
- A Gemini API key or an OpenAI-compatible API key

## Getting Started

Install dependencies:

```bash
npm install
```

Create a local environment file:

```bash
cp .env.example .env.local
```

Fill in `.env.local` with your AI provider and Supabase values:

```bash
# Select provider: gemini | openai
AI_PROVIDER=gemini

# Gemini
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.5-flash

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

If you prefer OpenAI or another OpenAI-compatible provider, set `AI_PROVIDER=openai` and fill in the `OPENAI_*` values shown in `.env.example`.

## Supabase Setup

Create a Supabase project, then run the SQL in `supabase/schema.sql` from the Supabase SQL editor. The schema creates:

- `profiles`
- `context_profiles`
- `lessons`
- `progress_events`

It also enables row level security and creates policies so users can access their own data.

Make sure your Supabase auth settings allow the callback URL used by the app:

```text
http://localhost:3000/auth/callback
```

## Run the App

Start the development server:

```bash
npm run dev
```

Open the app at:

```text
http://localhost:3000
```

From there, sign in, choose a target language, upload a JSON or CSV context file, review the extracted context, and generate a lesson.

## Useful Commands

```bash
npm run dev        # Start the local development server
npm run build      # Build for production
npm run start      # Start the production server
npm run lint       # Run ESLint
npm run test       # Run the Vitest test suite
npm run test:watch # Run Vitest in watch mode
```

## Context File Format

Orion accepts JSON and CSV exports. The upload page includes a sample file at `public/samples/orion-context-sample.json` that can be used to test the flow locally.

## Notes

- Keep `.env.local` private. It contains API keys and Supabase secrets.
- The service role key should only be used server-side.
- AI output quality depends on the uploaded context and the selected provider/model.

