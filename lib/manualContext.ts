import type { ContextSummary, ProficiencyLevel, TextRecord, TopicScore } from "@/types/orion";

const WORD_PATTERN = /[a-z0-9]+/gi;

function normalizeInterests(interests: string[]): string[] {
  const seen = new Set<string>();
  return interests
    .map((interest) => interest.trim().replace(/\s+/g, " "))
    .filter((interest) => {
      if (!interest) return false;
      const key = interest.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

function formatInterestList(interests: string[]): string {
  if (interests.length === 0) return "my personal interests";
  if (interests.length === 1) return interests[0] ?? "my personal interests";
  if (interests.length === 2) return `${interests[0]} and ${interests[1]}`;
  return `${interests.slice(0, -1).join(", ")}, and ${interests[interests.length - 1]}`;
}

function buildThemes(interests: string[]): TopicScore[] {
  const percentage = Math.max(1, Math.round(100 / Math.max(interests.length, 1)));
  return interests.map((interest) => ({
    name: interest,
    percentage
  }));
}

function buildVocabularyFrequency(interests: string[]): Record<string, number> {
  return interests.reduce<Record<string, number>>((frequency, interest) => {
    const words = interest.match(WORD_PATTERN) ?? [];
    for (const word of words) {
      const key = word.toLowerCase();
      if (key.length <= 2) continue;
      frequency[key] = (frequency[key] ?? 0) + 1;
    }
    return frequency;
  }, {});
}

export function buildManualContextRecords(interests: string[]): TextRecord[] {
  return normalizeInterests(interests).map((interest, index) => ({
    id: `manual-interest-${index + 1}`,
    text: `I want to learn language through ${interest}.`,
    source: "manual"
  }));
}

export function buildManualContextSummary(
  interests: string[],
  level: ProficiencyLevel = "Intermediate"
): ContextSummary {
  const normalizedInterests = normalizeInterests(interests);
  const interestList = formatInterestList(normalizedInterests);

  return {
    interests: normalizedInterests,
    themes: buildThemes(normalizedInterests),
    vocabulary: [],
    sampleSentences: [
      `I want to learn through ${interestList}.`,
      `Create language lessons about ${interestList}.`
    ],
    vocabularyFrequency: buildVocabularyFrequency(normalizedInterests),
    level,
    totalEntries: normalizedInterests.length
  };
}
