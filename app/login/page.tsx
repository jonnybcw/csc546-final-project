import { LoginForm } from "@/app/login/login-form";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

async function isLoggedIn() {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();

    return Boolean(user);
  } catch {
    return false;
  }
}

export default async function LoginPage({
  searchParams
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  if (await isLoggedIn()) {
    redirect("/home");
  }

  const params = await searchParams;
  const nextPath = params.next || "/language";
  const errorMessage =
    params.error === "auth_callback_failed"
      ? "Magic link verification failed. Request a new login link."
      : params.error === "invalid_callback"
        ? "Invalid login callback. Request a new login link."
        : null;

  return (
    <main className="mx-auto flex min-h-screen max-w-xl items-center px-6 py-10">
      <LoginForm nextPath={nextPath} initialError={errorMessage} />
    </main>
  );
}
