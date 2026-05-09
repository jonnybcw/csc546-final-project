import { z } from "zod";

import { requestAIJson } from "@/lib/aiClient";
import type { ContextSummary, TextRecord } from "@/types/orion";

const LEVEL_MAP: Record<string, ContextSummary["level"]> = {
  beginner: "Beginner",
  elementary: "Elementary",
  intermediate: "Intermediate",
  "upper intermediate": "Upper Intermediate",
  upper_intermediate: "Upper Intermediate",
  advanced: "Advanced"
};

const AIExtractSchema = z.object({
  interests: z.array(z.string().min(1)).min(1).max(10),
  themes: z
    .array(
      z.object({
        name: z.string().min(1),
        percentage: z.number().int().min(0).max(100)
      })
    )
    .min(1)
    .max(8),
  vocabulary: z
    .array(
      z.object({
        source: z.string().min(1),
        target: z.string().min(1)
      })
    )
    .max(16),
  sampleSentences: z.array(z.string().min(1)).min(1).max(8),
  level: z.enum(["Beginner", "Elementary", "Intermediate", "Upper Intermediate", "Advanced"])
});

function coerceLevel(value: unknown): ContextSummary["level"] | null {
  if (typeof value !== "string") return null;
  const normalized = value.toLowerCase().trim();
  return LEVEL_MAP[normalized] ?? null;
}

function normalizeVocabularyItem(item: unknown): { source: string; target: string } | null {
  if (typeof item === "string") {
    const splitByArrow = item.split("->");
    if (splitByArrow.length === 2) {
      return {
        source: splitByArrow[0].trim(),
        target: splitByArrow[1].trim()
      };
    }

    const splitByDash = item.split("-");
    if (splitByDash.length === 2) {
      return {
        source: splitByDash[0].trim(),
        target: splitByDash[1].trim()
      };
    }
    return null;
  }

  if (typeof item === "object" && item !== null) {
    const value = item as Record<string, unknown>;
    const sourceCandidate =
      value.source ?? value.word ?? value.term ?? value.english ?? value.en ?? value.original;
    const targetCandidate =
      value.target ?? value.translation ?? value.spanish ?? value.es ?? value.translated;

    if (typeof sourceCandidate === "string" && typeof targetCandidate === "string") {
      return {
        source: sourceCandidate.trim(),
        target: targetCandidate.trim()
      };
    }
  }

  return null;
}

function normalizeThemes(themes: unknown): ContextSummary["themes"] {
  if (!Array.isArray(themes)) return [];

  const normalized = themes
    .map((theme) => {
      if (typeof theme === "string") {
        return { name: theme.trim(), percentage: 10 };
      }
      if (typeof theme !== "object" || theme === null) return null;
      const value = theme as Record<string, unknown>;
      const name = typeof value.name === "string" ? value.name : typeof value.topic === "string" ? value.topic : null;
      const percentageRaw = value.percentage ?? value.weight ?? value.score ?? 0;
      const numericPercentage =
        typeof percentageRaw === "number"
          ? percentageRaw
          : typeof percentageRaw === "string"
            ? Number.parseInt(percentageRaw, 10)
            : 0;
      if (!name) return null;
      return {
        name: name.trim(),
        percentage: Math.max(0, Math.min(100, Math.round(Number.isNaN(numericPercentage) ? 0 : numericPercentage)))
      };
    })
    .filter((entry): entry is { name: string; percentage: number } => !!entry && entry.name.length > 0)
    .slice(0, 8);

  return normalized;
}

function normalizeAIExtractResult(
  result: unknown
): z.infer<typeof AIExtractSchema> {
  const value = typeof result === "object" && result !== null ? (result as Record<string, unknown>) : {};

  const interests = Array.isArray(value.interests)
    ? value.interests
        .filter((entry): entry is string => typeof entry === "string")
        .map((entry) => entry.trim())
        .filter((entry) => entry.length > 0)
        .slice(0, 10)
    : [];

  const sampleSentences = Array.isArray(value.sampleSentences)
    ? value.sampleSentences
        .filter((entry): entry is string => typeof entry === "string")
        .map((entry) => entry.trim())
        .filter((entry) => entry.length > 0)
        .slice(0, 8)
    : [];

  const vocabularyRaw = Array.isArray(value.vocabulary)
    ? value.vocabulary
    : Array.isArray(value.keyVocabulary)
      ? value.keyVocabulary
      : [];

  const vocabulary = vocabularyRaw
    .map(normalizeVocabularyItem)
    .filter((entry): entry is { source: string; target: string } => !!entry)
    .filter((entry) => entry.source.length > 0 && entry.target.length > 0)
    .slice(0, 16);

  const candidate = {
    interests,
    themes: normalizeThemes(value.themes),
    vocabulary,
    sampleSentences,
    level: coerceLevel(value.level)
  };

  return AIExtractSchema.parse(candidate);
}

function buildRecordExcerpt(records: TextRecord[]): string {
  return records
    .slice(0, 80)
    .map((record, index) => `${index + 1}. ${record.text.slice(0, 280)}`)
    .join("\n");
}

export async function extractContextSummaryWithAI(
  records: TextRecord[],
  fallbackSummary: ContextSummary
): Promise<{ summary: ContextSummary; source: "ai" }> {
  const excerpt = buildRecordExcerpt(records);

  try {
    const result = await requestAIJson(
      [
        {
          role: "system",
          content:
            "You are an expert language-learning analyst. Return only valid JSON that matches the required shape."
        },
        {
          role: "user",
          content: `Analyze the user's imported conversation snippets and extract:
- top interests
- weighted themes with percentages
- key vocabulary pairs (english -> spanish)
- representative sample sentences
- estimated language level

Snippets:
${excerpt}

Return JSON with keys:
- interests: string[]
- themes: { name: string, percentage: number }[]
- vocabulary: { source: string, target: string }[]
- sampleSentences: string[]
- level: one of Beginner | Elementary | Intermediate | Upper Intermediate | Advanced`
        }
      ],
      0.1
    );

    if (!result) throw new Error("AI provider not configured");

    const parsed = normalizeAIExtractResult(result);
    return {
      source: "ai",
      summary: {
        ...fallbackSummary,
        interests: parsed.interests,
        themes: parsed.themes,
        vocabulary: parsed.vocabulary,
        sampleSentences: parsed.sampleSentences,
        level: parsed.level
      }
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown error";
    throw new Error(`AI extraction failed: ${message}`);
  }
}
