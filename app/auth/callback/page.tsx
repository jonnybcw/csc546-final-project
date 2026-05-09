import { AuthCallbackClient } from "@/app/auth/callback/callback-client";

export default async function AuthCallbackPage({
  searchParams
}: {
  searchParams: Promise<{
    code?: string;
    next?: string;
  }>;
}) {
  const params = await searchParams;
  const nextPath = params.next && params.next.startsWith("/") ? params.next : "/language";

  return (
    <main className="mx-auto flex min-h-screen max-w-xl items-center px-4 py-8 sm:px-6 sm:py-10">
      <AuthCallbackClient
        code={params.code ?? null}
        nextPath={nextPath}
      />
    </main>
  );
}
