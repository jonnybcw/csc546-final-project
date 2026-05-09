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
      ? "Google sign-in failed. Please try again."
      : params.error === "invalid_callback"
        ? "Invalid sign-in callback. Please try again."
        : null;

  return (
    <main className="mx-auto flex min-h-screen max-w-xl items-center px-4 py-8 sm:px-6 sm:py-10">
      <LoginForm nextPath={nextPath} initialError={errorMessage} />
    </main>
  );
}
