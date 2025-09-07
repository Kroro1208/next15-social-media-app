import { supabase } from "@/supabase-client";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    try {
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);

      if (error) {
        return NextResponse.redirect(
          `${origin}/auth/login?error=${encodeURIComponent(error.message)}`,
        );
      }

      if (data?.session) {
        return NextResponse.redirect(`${origin}/`);
      }
    } catch (error) {
      return NextResponse.redirect(
        `${origin}/auth/login?error=unexpected_error`,
      );
    }
  }

  return NextResponse.redirect(`${origin}/auth/login?error=no_code`);
}
