import { NextResponse } from "next/server";
import { z } from "zod";

import { generateDailyLessonWithAI } from "@/lib/aiLesson";
import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase/server";
import type { ContextSummary, ProgressSnapshot } from "@/types/orion";

const RequestSchema = z.object({
  summary: z.custom<ContextSummary>(),
  progress: z.custom<ProgressSnapshot>(),
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

    const { lesson, source } = await generateDailyLessonWithAI(
      payload.summary,
      payload.progress,
      payload.targetLanguage
    );

    let dbClient = supabase;
    try {
      dbClient = createSupabaseAdminClient();
    } catch {
      // Service role is optional in local setups; use user-scoped client with RLS instead.
    }

    const { data: contextRows, error: contextFetchError } = await dbClient
      .from("context_profiles")
      .select("id")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1);
    if (contextFetchError) throw new Error(contextFetchError.message);

    const latestContextId = contextRows?.[0]?.id as string | undefined;
    if (latestContextId) {
      const { error: contextUpdateError } = await dbClient
        .from("context_profiles")
        .update({
          summary_json: payload.summary,
          total_entries: payload.summary.totalEntries
        })
        .eq("id", latestContextId)
        .eq("user_id", user.id);
      if (contextUpdateError) throw new Error(contextUpdateError.message);
    }

    const { error: lessonError } = await dbClient.from("lessons").insert({
      user_id: user.id,
      source,
      target_language: payload.targetLanguage ?? "Spanish",
      lesson_json: lesson,
      created_at: new Date().toISOString()
    });
    if (lessonError) throw new Error(lessonError.message);

    return NextResponse.json({ lesson, source });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to generate lesson";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
