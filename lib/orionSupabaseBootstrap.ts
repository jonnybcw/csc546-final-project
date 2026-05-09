import type { SupabaseClient } from "@supabase/supabase-js";

import { getLocalDateKey, withLessonActivityDates } from "@/lib/progress";
import { useOrionStore } from "@/store/orionStore";
import type { ContextSummary, LessonPlan, TextRecord } from "@/types/orion";

function isContextSummary(x: unknown): x is ContextSummary {
  return (
    typeof x === "object" &&
    x !== null &&
    Array.isArray((x as ContextSummary).interests) &&
    typeof (x as ContextSummary).totalEntries === "number"
  );
}

function isTextRecordArray(x: unknown): x is TextRecord[] {
  return (
    Array.isArray(x) &&
    x.every((r) => r && typeof r === "object" && typeof (r as TextRecord).text === "string")
  );
}

function isLessonPlan(x: unknown): x is LessonPlan {
  return (
    typeof x === "object" &&
    x !== null &&
    typeof (x as LessonPlan).title === "string" &&
    Array.isArray((x as LessonPlan).exercises)
  );
}

/**
 * Loads latest context + lesson saved for this Supabase user and writes them into the Orion store.
 * Call after the client session is established so RLS policies apply.
 */
export async function syncOrionStateFromSupabase(supabase: SupabaseClient): Promise<void> {
  try {
    const {
      data: { user },
      error: userError
    } = await supabase.auth.getUser();

    if (userError || !user) return;

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("target_language, full_name")
      .eq("user_id", user.id)
      .maybeSingle();

    if (profileError) {
      console.warn("[Orion] profiles fetch failed", profileError.message);
    } else {
      useOrionStore.getState().setUserFullName((profile?.full_name as string | null | undefined) ?? null);
    }

    const { data: contextRows, error: contextError } = await supabase
      .from("context_profiles")
      .select("summary_json, raw_records_json")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1);

    if (contextError) {
      console.warn("[Orion] context_profiles fetch failed", contextError.message);
      return;
    }

    const ctxRow = contextRows?.[0];
    if (!ctxRow) return;

    const summary = ctxRow.summary_json;
    const records = ctxRow.raw_records_json;
    if (!isContextSummary(summary) || !isTextRecordArray(records)) {
      console.warn("[Orion] Invalid context JSON from server");
      return;
    }

    const { data: lessonRows, error: lessonError } = await supabase
      .from("lessons")
      .select("lesson_json, target_language")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1);

    if (lessonError) {
      console.warn("[Orion] lessons fetch failed", lessonError.message);
    }

    const lessonRow = lessonRows?.[0];
    const lesson =
      lessonRow?.lesson_json && isLessonPlan(lessonRow.lesson_json) ? lessonRow.lesson_json : null;

    const targetLanguage =
      profile?.target_language ?? lesson?.targetLanguage ?? lessonRow?.target_language ?? null;

    const { data: progressRows, error: progressError } = await supabase
      .from("progress_events")
      .select("created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1000);

    if (progressError) {
      console.warn("[Orion] progress_events fetch failed", progressError.message);
    }

    const progress = progressError
      ? undefined
      : withLessonActivityDates(
          useOrionStore.getState().progress,
          progressRows?.map((row) => getLocalDateKey(new Date(row.created_at as string))) ?? []
        );

    useOrionStore.getState().bootstrapFromServer({
      records,
      summary,
      lesson,
      targetLanguage,
      userFullName: (profile?.full_name as string | null | undefined) ?? null,
      progress
    });
  } catch (e) {
    console.warn("[Orion] syncOrionStateFromSupabase", e);
  }
}
