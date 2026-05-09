import { describe, expect, it } from "vitest";

import { buildManualContextRecords, buildManualContextSummary } from "../lib/manualContext";

describe("manualContext", () => {
  it("trims, dedupes, and preserves interest labels", () => {
    const summary = buildManualContextSummary(["  Cooking  ", "travel", "Cooking", "music theory"]);

    expect(summary.interests).toEqual(["Cooking", "travel", "music theory"]);
    expect(summary.totalEntries).toBe(3);
    expect(summary.level).toBe("Intermediate");
  });

  it("builds themes and sample sentences from interests", () => {
    const summary = buildManualContextSummary(["Cooking", "Travel"]);

    expect(summary.themes).toEqual([
      { name: "Cooking", percentage: 50 },
      { name: "Travel", percentage: 50 }
    ]);
    expect(summary.sampleSentences[0]).toContain("Cooking and Travel");
  });

  it("creates text records that can be persisted with the manual profile", () => {
    const records = buildManualContextRecords(["Cooking", "Travel"]);

    expect(records).toEqual([
      {
        id: "manual-interest-1",
        text: "I want to learn language through Cooking.",
        source: "manual"
      },
      {
        id: "manual-interest-2",
        text: "I want to learn language through Travel.",
        source: "manual"
      }
    ]);
  });
});
