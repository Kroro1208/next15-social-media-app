import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get("code");

    console.log("=== Callback route executed ===");
    console.log("Code exists:", !!code);
    console.log("Full URL:", request.url);

    if (!code) {
      console.log(
        "No code found in query. Redirecting to client-side callback to handle fragment/hash if present",
      );
      // If there's no `code` in the query params, it may be that the provider returned
      // tokens in the URL fragment (implicit flow). Redirect to a client-side handler
      // that can read window.location.hash and let the Supabase client recover the session.
      return NextResponse.redirect(`${origin}/auth/callback-client`);
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
