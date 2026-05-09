import { NextResponse } from "next/server";
import { z } from "zod";

import { analyzeContext } from "@/lib/analyzeContext";
import { extractContextSummaryWithAI } from "@/lib/aiExtract";
import { parseContextPayload } from "@/lib/parsers";
import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase/server";
import type { UploadApiResponse } from "@/types/orion";

const RequestSchema = z.object({
  fileName: z.string().min(1),
  mimeType: z.string().optional(),
  rawContent: z.string().min(1),
  targetLanguage: z.string().optional()
});

export async function POST(request: Request) {
  try {
    const payload = RequestSchema.parse(await request.json());
    const supabase = await createSupabaseServerClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { records } = parseContextPayload(payload);
    const fallbackSummary = analyzeContext(records);
    const { summary, source } = await extractContextSummaryWithAI(records, fallbackSummary);

    let dbClient = supabase;
    try {
      dbClient = createSupabaseAdminClient();
    } catch {
      // Service role is optional in local setups; use user-scoped client with RLS instead.
    }
    const now = new Date().toISOString();

    const { error: profileError } = await dbClient.from("profiles").upsert(
      {
        user_id: user.id,
        email: user.email,
        target_language: payload.targetLanguage ?? null,
        updated_at: now
      },
      { onConflict: "user_id" }
    );
    if (profileError) throw new Error(profileError.message);

    const { error: contextError } = await dbClient.from("context_profiles").insert({
      user_id: user.id,
      source,
      total_entries: summary.totalEntries,
      summary_json: summary,
      raw_records_json: records,
      created_at: now
    });
    if (contextError) throw new Error(contextError.message);

    const response: UploadApiResponse = { summary, records, source };
    return NextResponse.json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to process upload";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
