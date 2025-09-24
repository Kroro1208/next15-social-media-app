import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const supabaseUrl = process.env["SUPABASE_URL"]!;
    const supabaseAnonKey = process.env["SUPABASE_ANON_KEY"]!;

    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get("code");
    const error = searchParams.get("error");

    if (error) {
      return NextResponse.redirect(`${origin}/auth/login?error=${error}`);
    }

    if (!code) {
      return NextResponse.redirect(`${origin}/auth/login?error=no_code`);
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const { data, error: exchangeError } =
      await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError) {
      return NextResponse.redirect(
        `${origin}/auth/login?error=exchange_failed`,
      );
    }

    if (!data.session) {
      return NextResponse.redirect(`${origin}/auth/login?error=no_session`);
    }

    return NextResponse.redirect(`${origin}/`);
  } catch (error) {
    const { origin } = new URL(request.url);
    return NextResponse.redirect(`${origin}/auth/login?error=callback_failed`);
  }
}
