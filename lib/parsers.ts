import Papa from "papaparse";
import { z } from "zod";

import type { SupportedFileType, TextRecord } from "@/types/orion";
import { normalizeToTextRecords } from "@/lib/normalize";

const UploadedPayloadSchema = z.object({
  fileName: z.string().min(1),
  mimeType: z.string().optional(),
  rawContent: z.string().min(1)
});

function detectFileType(fileName: string): SupportedFileType {
  if (fileName.toLowerCase().endsWith(".csv")) return "csv";
  return "json";
}

function parseCsv(rawContent: string): unknown[] {
  const parsed = Papa.parse<Record<string, string>>(rawContent, {
    header: true,
    skipEmptyLines: true
  });

  if (parsed.errors.length > 0) {
    throw new Error(parsed.errors[0]?.message ?? "Invalid CSV content");
  }

  return parsed.data;
}

function parseJson(rawContent: string): unknown {
  try {
    return JSON.parse(rawContent);
  } catch {
    throw new Error("Invalid JSON content");
  }
}

export function parseContextPayload(input: unknown): {
  records: TextRecord[];
  fileType: SupportedFileType;
} {
  const payload = UploadedPayloadSchema.parse(input);
  const fileType = detectFileType(payload.fileName);
  const parsed = fileType === "csv" ? parseCsv(payload.rawContent) : parseJson(payload.rawContent);
  const records = normalizeToTextRecords(parsed);

  if (records.length === 0) {
    throw new Error("No usable text entries found in uploaded file");
  }

  return { records, fileType };
}
