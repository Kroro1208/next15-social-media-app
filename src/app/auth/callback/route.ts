import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get("code");
    const oauthError = searchParams.get("error");
    const errorDescription = searchParams.get("error_description");

    console.log("=== Callback route executed ===");
    console.log("Full URL:", request.url);
    console.log("Origin:", origin);
    console.log("Code exists:", !!code);
    console.log("Error param:", oauthError);
    console.log("Error description:", errorDescription);
    console.log(
      "All search params:",
      Object.fromEntries(searchParams.entries()),
    );

    // OAuth エラーパラメータが含まれている場合
    if (oauthError) {
      console.log("OAuth error detected:", oauthError, errorDescription);
      return NextResponse.redirect(
        `${origin}/auth/login?error=${encodeURIComponent(oauthError)}&description=${encodeURIComponent(errorDescription || "")}`,
      );
    }

    if (!code) {
      console.log("No code found, redirecting to login");
      return NextResponse.redirect(`${origin}/auth/login?error=no_code`);
    }

    const supabase = createClient(
      process.env["NEXT_PUBLIC_SUPABASE_URL"]!,
      process.env["NEXT_PUBLIC_SUPABASE_ANON_KEY"]!,
    );

    console.log("Attempting to exchange code for session");
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error("Error exchanging code:", error);
      return NextResponse.redirect(
        `${origin}/auth/login?error=${encodeURIComponent(error.message)}`,
      );
    }

    if (data?.session) {
      console.log("Session created successfully, redirecting to home");
      return NextResponse.redirect(`${origin}/`);
    }

    console.log("No session created, redirecting to login");
    return NextResponse.redirect(`${origin}/auth/login?error=no_session`);
  } catch (error) {
    console.error("Unexpected error in callback:", error);
    return NextResponse.redirect(
      `${new URL(request.url).origin}/auth/login?error=server_error`,
    );
  }
}
