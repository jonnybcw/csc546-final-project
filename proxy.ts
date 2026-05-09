import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/middleware";

const PROTECTED_PREFIXES = ["/language", "/upload", "/processing", "/review", "/home", "/lesson"];

function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export async function proxy(request: NextRequest) {
  const { supabase, response } = createClient(request);

  if (!isProtectedPath(request.nextUrl.pathname)) {
    return response;
  }

  if (!supabase) return response;

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: ["/language/:path*", "/upload/:path*", "/processing/:path*", "/review/:path*", "/home/:path*", "/lesson/:path*"]
};
