import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get("code");
    const oauthError = requestUrl.searchParams.get("error");
    const error_description = requestUrl.searchParams.get("error_description");

    console.log("=== OAuth Callback Debug ===");
    console.log("Full callback URL:", request.url);
    console.log("Request method:", request.method);
    console.log("Request headers:", Object.fromEntries(request.headers.entries()));
    console.log(
      "All URL parameters:",
      Object.fromEntries(requestUrl.searchParams.entries()),
    );
    console.log("Code param:", code);
    console.log("Error param:", oauthError);
    console.log("Error description:", error_description);
    console.log("Origin:", requestUrl.origin);
    console.log("Pathname:", requestUrl.pathname);
    console.log("=== End Debug ===");

    if (oauthError) {
      console.log("OAuth error received:", oauthError, error_description);
      return NextResponse.redirect(
        `${requestUrl.origin}/auth/login?error=oauth_error&details=${encodeURIComponent(error_description || oauthError)}`,
      );
    }

    if (!code) {
      console.log("No code found in callback");
      return NextResponse.redirect(
        `${requestUrl.origin}/auth/login?error=no_code`,
      );
    }

    const supabaseUrl = process.env["NEXT_PUBLIC_SUPABASE_URL"]?.trim();
    const supabaseKey = process.env["NEXT_PUBLIC_SUPABASE_ANON_KEY"]?.trim();

    if (!supabaseUrl || !supabaseKey) {
      console.log("Missing Supabase environment variables");
      return NextResponse.redirect(
        `${requestUrl.origin}/auth/login?error=config_error`,
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        flowType: "pkce",
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    });

    console.log("Attempting to exchange code for session");
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error("Auth exchange error:", error);
      return NextResponse.redirect(
        `${requestUrl.origin}/auth/login?error=auth_failed&details=${encodeURIComponent(error.message)}`,
      );
    }

    if (data.session) {
      console.log("Session created successfully", data.session.user?.email);
      return NextResponse.redirect(`${requestUrl.origin}/`);
    } else {
      console.log("No session in response data");
      return NextResponse.redirect(
        `${requestUrl.origin}/auth/login?error=no_session`,
      );
    }
  } catch (error) {
    console.error("Callback error:", error);
    const requestUrl = new URL(request.url);
    return NextResponse.redirect(
      `${requestUrl.origin}/auth/login?error=server_error`,
    );
  }
}
