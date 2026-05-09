import { cookies } from "next/headers";

import { createClient } from "@/utils/supabase/server";

export default async function SupabaseExamplePage() {
  const cookieStore = await cookies();
  const supabase = await createClient(cookieStore);

  const { data: todos } = await supabase.from("todos").select();

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <h1 className="mb-4 text-2xl font-semibold">Supabase Todos Example</h1>
      <ul className="list-disc space-y-2 pl-6 text-slate-200">
        {todos?.map((todo) => (
          <li key={todo.id}>{todo.name}</li>
        ))}
      </ul>
    </main>
  );
}
