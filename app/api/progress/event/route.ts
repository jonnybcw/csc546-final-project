import { NextResponse } from "next/server";
import { z } from "zod";

import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase/server";

const RequestSchema = z.object({
  lessonTitle: z.string().min(1),
  exerciseId: z.string().min(1),
  correct: z.boolean()
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

    let dbClient = supabase;
    try {
      dbClient = createSupabaseAdminClient();
    } catch {
      // Service role is optional in local setups; use user-scoped client with RLS instead.
    }

    const { error } = await dbClient.from("progress_events").insert({
      user_id: user.id,
      lesson_title: payload.lessonTitle,
      exercise_id: payload.exerciseId,
      correct: payload.correct,
      created_at: new Date().toISOString()
    });
    if (error) throw new Error(error.message);

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to persist progress";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
