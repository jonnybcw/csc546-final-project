import { describe, expect, it } from "vitest";

import { parseContextPayload } from "../lib/parsers";

describe("parseContextPayload", () => {
  it("parses JSON payloads into text records", () => {
    const result = parseContextPayload({
      fileName: "chat.json",
      rawContent: JSON.stringify([
        { id: "1", text: "I study Spanish every day", source: "chat" },
        { id: "2", message: "I debug APIs for work" }
      ])
    });

    expect(result.fileType).toBe("json");
    expect(result.records).toHaveLength(2);
    expect(result.records[0].text).toContain("Spanish");
  });

  it("parses CSV payloads into text records", () => {
    const result = parseContextPayload({
      fileName: "chat.csv",
      rawContent: "text,source\nI plan a travel itinerary,gemini\nI go to the gym,chatgpt\n"
    });

    expect(result.fileType).toBe("csv");
    expect(result.records).toHaveLength(2);
  });
});
