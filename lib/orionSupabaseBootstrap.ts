import type { SupabaseClient } from "@supabase/supabase-js";

import { getLocalDateKey, LESSON_COMPLETION_EVENT_ID, withLessonActivityDates } from "@/lib/progress";
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

function getAuthDisplayName(userMetadata: Record<string, unknown> | undefined): string | null {
  const name = userMetadata?.full_name ?? userMetadata?.name;
  return typeof name === "string" && name.trim().length > 0 ? name.trim() : null;
}

/**
 * Loads latest context + lesson saved for this Supabase user and writes them into the Orion store.
 * Call after the client session is established so RLS policies apply.
 */
export async function syncOrionStateFromSupabase(supabase: SupabaseClient): Promise<boolean> {
  try {
    const {
      data: { user },
      error: userError
    } = await supabase.auth.getUser();

    if (userError || !user) return false;

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("target_language, full_name")
      .eq("user_id", user.id)
      .maybeSingle();

    let syncedProfile = profile;
    if (profileError) {
      console.warn("[Orion] profiles fetch failed", profileError.message);
    } else {
      const profileName = (profile?.full_name as string | null | undefined)?.trim() || null;
      const authName = getAuthDisplayName(user.user_metadata);

      if (!profileName && (authName || user.email)) {
        const { data: updatedProfile, error: updateProfileError } = await supabase
          .from("profiles")
          .upsert(
            {
              user_id: user.id,
              email: user.email ?? null,
              full_name: authName,
              target_language: (profile?.target_language as string | null | undefined) ?? null,
              updated_at: new Date().toISOString()
            },
            { onConflict: "user_id" }
          )
          .select("target_language, full_name")
          .maybeSingle();

        if (updateProfileError) {
          console.warn("[Orion] profile name sync failed", updateProfileError.message);
        } else {
          syncedProfile = updatedProfile;
        }
      }

      useOrionStore.getState().setUserFullName((syncedProfile?.full_name as string | null | undefined) ?? null);
    }

    const { data: contextRows, error: contextError } = await supabase
      .from("context_profiles")
      .select("summary_json, raw_records_json")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1);

    if (contextError) {
      console.warn("[Orion] context_profiles fetch failed", contextError.message);
      return false;
    }

    const ctxRow = contextRows?.[0];
    if (!ctxRow) return true;

    const summary = ctxRow.summary_json;
    const records = ctxRow.raw_records_json;
    if (!isContextSummary(summary) || !isTextRecordArray(records)) {
      console.warn("[Orion] Invalid context JSON from server");
      return false;
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
      syncedProfile?.target_language ?? lesson?.targetLanguage ?? lessonRow?.target_language ?? null;

    const { data: progressRows, error: progressError } = await supabase
      .from("progress_events")
      .select("created_at")
      .eq("user_id", user.id)
      .eq("exercise_id", LESSON_COMPLETION_EVENT_ID)
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
      userFullName: (syncedProfile?.full_name as string | null | undefined) ?? null,
      progress
    });
    return true;
  } catch (e) {
    console.warn("[Orion] syncOrionStateFromSupabase", e);
    return false;
  }
}
