import type { ContextSummary } from "@/types/orion";

function mergeFrequency(
  current: Record<string, number>,
  incoming: Record<string, number>
): Record<string, number> {
  const merged = { ...current };
  Object.entries(incoming).forEach(([word, count]) => {
    merged[word] = (merged[word] ?? 0) + count;
  });
  return merged;
}

export function mergeContextSummary(current: ContextSummary | null, incoming: ContextSummary): ContextSummary {
  if (!current) return incoming;

  const interestSet = new Set([...current.interests, ...incoming.interests]);
  const themeMap = new Map<string, number>();

  [...current.themes, ...incoming.themes].forEach((theme) => {
    themeMap.set(theme.name, (themeMap.get(theme.name) ?? 0) + theme.percentage);
  });

  const mergedThemes = Array.from(themeMap.entries())
    .map(([name, percentage]) => ({ name, percentage: Math.min(100, percentage) }))
    .sort((a, b) => b.percentage - a.percentage)
    .slice(0, 6);

  const vocabularyMap = new Map<string, string>();
  [...current.vocabulary, ...incoming.vocabulary].forEach((item) => {
    vocabularyMap.set(item.source, item.target);
  });

  return {
    ...incoming,
    interests: Array.from(interestSet),
    themes: mergedThemes,
    vocabulary: Array.from(vocabularyMap.entries()).map(([source, target]) => ({ source, target })),
    sampleSentences: [...current.sampleSentences, ...incoming.sampleSentences].slice(0, 8),
    vocabularyFrequency: mergeFrequency(current.vocabularyFrequency, incoming.vocabularyFrequency),
    totalEntries: current.totalEntries + incoming.totalEntries
  };
}
