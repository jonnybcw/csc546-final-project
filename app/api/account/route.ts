import { NextResponse } from "next/server";

import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase/server";

export async function DELETE() {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const admin = createSupabaseAdminClient();
    const tables = ["progress_events", "lessons", "context_profiles", "profiles"] as const;

    for (const table of tables) {
      const { error } = await admin.from(table).delete().eq("user_id", user.id);
      if (error) throw new Error(error.message);
    }

    const { error: deleteUserError } = await admin.auth.admin.deleteUser(user.id);
    if (deleteUserError) throw new Error(deleteUserError.message);

    return NextResponse.json({ ok: true });
  } catch (error) {
    const rawMessage = error instanceof Error ? error.message : "Failed to delete account";
    const missingServiceRole = rawMessage.includes("SUPABASE_SERVICE_ROLE_KEY");
    const message = missingServiceRole
      ? "Account deletion requires SUPABASE_SERVICE_ROLE_KEY to be configured."
      : rawMessage;
    const status = missingServiceRole ? 501 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
