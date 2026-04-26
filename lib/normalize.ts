import type { TextRecord } from "@/types/orion";

const TEXT_KEYS = [
  "text",
  "content",
  "message",
  "prompt",
  "response",
  "body",
  "title"
];

function pickTextFromObject(value: Record<string, unknown>): string {
  for (const key of TEXT_KEYS) {
    const match = value[key];
    if (typeof match === "string" && match.trim().length > 0) {
      return match.trim();
    }
  }

  const fallback = Object.values(value)
    .filter((entry) => typeof entry === "string")
    .join(" ")
    .trim();

  return fallback;
}

export function normalizeToTextRecords(input: unknown): TextRecord[] {
  if (!input) return [];

  const items = Array.isArray(input) ? input : [input];
  const records: TextRecord[] = [];

  items.forEach((item, index) => {
    if (typeof item === "string") {
      const text = item.trim();
      if (!text) return;
      records.push({ id: `r-${index}`, text, source: "imported" });
      return;
    }

    if (typeof item === "object" && item !== null) {
      const obj = item as Record<string, unknown>;
      const text = pickTextFromObject(obj);
      if (!text) return;

      records.push({
        id: String(obj.id ?? `r-${index}`),
        text,
        source: String(obj.source ?? "imported"),
        createdAt: typeof obj.createdAt === "string" ? obj.createdAt : undefined
      });
    }
  });

  return records;
}
