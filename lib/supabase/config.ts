function read(name: string): string | null {
  const value = process.env[name]?.trim();
  if (!value || value.length === 0) return null;
  if (value === "..." || value.startsWith("your_")) return null;
  return value;
}

export function getSupabaseUrl(): string | null {
  return read("NEXT_PUBLIC_SUPABASE_URL");
}

export function getSupabaseAnonKey(): string | null {
  return read("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY") ?? read("NEXT_PUBLIC_SUPABASE_ANON_KEY");
}

export function getSupabaseServiceRoleKey(): string | null {
  return read("SUPABASE_SERVICE_ROLE_KEY");
}
