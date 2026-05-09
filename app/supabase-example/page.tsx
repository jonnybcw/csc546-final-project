import { cookies } from "next/headers";

import { Card } from "@/components/ui/card";
import { createClient } from "@/utils/supabase/server";

export default async function SupabaseExamplePage() {
  const cookieStore = await cookies();
  const supabase = await createClient(cookieStore);

  const { data: todos, error } = await supabase.from("todos").select();

  return (
    <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-10">
      <h1 className="mb-4 text-xl font-semibold sm:text-2xl">Supabase Todos Example</h1>
      {error ? (
        <Card className="border-rose-400/25 bg-rose-500/[0.06] p-5" role="alert">
          <p className="font-semibold text-rose-100">Could not load todos</p>
          <p className="mt-2 text-sm text-rose-100/75">{error.message}</p>
        </Card>
      ) : todos && todos.length > 0 ? (
        <ul className="list-disc space-y-2 pl-6 text-slate-200">
          {todos.map((todo) => (
            <li key={todo.id}>{todo.name}</li>
          ))}
        </ul>
      ) : (
        <Card className="p-5">
          <p className="font-semibold text-white">No todos found</p>
          <p className="mt-2 text-sm text-slate-400">The example table loaded, but it does not have any rows yet.</p>
        </Card>
      )}
    </main>
  );
}
