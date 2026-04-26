import { NextResponse } from "next/server";

import { analyzeContext } from "@/lib/analyzeContext";
import { parseContextPayload } from "@/lib/parsers";
import type { UploadApiResponse } from "@/types/orion";

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const { records } = parseContextPayload(payload);
    const summary = analyzeContext(records);

    const response: UploadApiResponse = { summary, records };
    return NextResponse.json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to process upload";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
