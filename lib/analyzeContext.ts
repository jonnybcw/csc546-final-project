import type { ContextSummary, ProficiencyLevel, TextRecord, TopicScore, VocabularyPair } from "@/types/orion";

const TOPIC_KEYWORDS: Record<string, string[]> = {
  Coding: ["code", "coding", "debug", "deploy", "feature", "api", "commit", "project", "software"],
  Travel: ["travel", "trip", "flight", "hotel", "city", "airport", "itinerary"],
  Fitness: ["gym", "fitness", "workout", "exercise", "nutrition", "health", "routine"],
  "Daily Life": ["family", "daily", "morning", "evening", "home", "shopping", "cook"],
  "Learning & Self Improvement": ["learn", "practice", "study", "improve", "progress", "habit"]
};

const TRANSLATION_MAP: Record<string, string> = {
  deploy: "desplegar",
  debug: "depurar",
  commit: "confirmar",
  routine: "rutina",
  progress: "progreso",
  project: "proyecto",
  fitness: "estado fisico",
  travel: "viajar",
  learning: "aprendizaje",
  language: "idioma"
};

const LEVELS: ProficiencyLevel[] = [
  "Beginner",
  "Elementary",
  "Intermediate",
  "Upper Intermediate",
  "Advanced"
];

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((token) => token.length > 2);
}

function calculateTopics(tokens: string[]): TopicScore[] {
  const total = Math.max(tokens.length, 1);

  const scores = Object.entries(TOPIC_KEYWORDS).map(([name, keywords]) => {
    const hits = tokens.filter((token) => keywords.includes(token)).length;
    const percentage = Math.round((hits / total) * 100);
    return { name, percentage };
  });

  const nonZero = scores.filter((topic) => topic.percentage > 0);
  if (nonZero.length > 0) return nonZero.sort((a, b) => b.percentage - a.percentage).slice(0, 4);

  return [
    { name: "Work & Projects", percentage: 34 },
    { name: "Learning & Self Improvement", percentage: 21 },
    { name: "Daily Life", percentage: 18 },
    { name: "Health & Fitness", percentage: 15 }
  ];
}

function estimateLevel(uniqueWords: number, avgSentenceLength: number): ProficiencyLevel {
  const score = uniqueWords * 0.7 + avgSentenceLength * 2;
  if (score < 20) return LEVELS[0];
  if (score < 35) return LEVELS[1];
  if (score < 50) return LEVELS[2];
  if (score < 70) return LEVELS[3];
  return LEVELS[4];
}

function buildVocabularyPairs(vocabularyFrequency: Record<string, number>): VocabularyPair[] {
  return Object.entries(vocabularyFrequency)
    .filter(([word]) => TRANSLATION_MAP[word])
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([source]) => ({
      source,
      target: TRANSLATION_MAP[source]
    }));
}

export function analyzeContext(records: TextRecord[]): ContextSummary {
  const texts = records.map((record) => record.text);
  const tokens = texts.flatMap(tokenize);

  const vocabularyFrequency = tokens.reduce<Record<string, number>>((acc, token) => {
    acc[token] = (acc[token] ?? 0) + 1;
    return acc;
  }, {});

  const uniqueWords = Object.keys(vocabularyFrequency).length;
  const sentenceLengths = texts.map((text) => tokenize(text).length).filter((len) => len > 0);
  const avgSentenceLength =
    sentenceLengths.length > 0
      ? sentenceLengths.reduce((sum, value) => sum + value, 0) / sentenceLengths.length
      : 0;

  const themes = calculateTopics(tokens);
  const interests = themes.map((theme) => theme.name);
  const vocabulary = buildVocabularyPairs(vocabularyFrequency);

  return {
    interests,
    themes,
    vocabulary,
    sampleSentences: texts.slice(0, 4),
    vocabularyFrequency,
    level: estimateLevel(uniqueWords, avgSentenceLength),
    totalEntries: records.length
  };
}
