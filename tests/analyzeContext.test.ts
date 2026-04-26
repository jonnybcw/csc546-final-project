import { describe, expect, it } from "vitest";

import { analyzeContext } from "../lib/analyzeContext";

describe("analyzeContext", () => {
  it("extracts interests, themes and vocabulary from records", () => {
    const summary = analyzeContext([
      {
        id: "1",
        text: "I debug software and deploy APIs for my project routine",
        source: "imported"
      },
      {
        id: "2",
        text: "My gym routine helps me stay consistent with progress",
        source: "imported"
      }
    ]);

    expect(summary.interests.length).toBeGreaterThan(0);
    expect(summary.themes.length).toBeGreaterThan(0);
    expect(summary.vocabulary.length).toBeGreaterThan(0);
    expect(summary.totalEntries).toBe(2);
  });
});
