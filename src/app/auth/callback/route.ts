import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get("code");

    console.log("Callback URL:", request.url);
    console.log("Code param:", code);

    if (!code) {
      console.log("No code found in callback");
      return NextResponse.redirect(`${requestUrl.origin}/auth/login?error=no_code`);
    }

    const supabaseUrl = process.env["NEXT_PUBLIC_SUPABASE_URL"];
    const supabaseKey = process.env["NEXT_PUBLIC_SUPABASE_ANON_KEY"];

    if (!supabaseUrl || !supabaseKey) {
      console.log("Missing Supabase environment variables");
      return NextResponse.redirect(`${requestUrl.origin}/auth/login?error=config_error`);
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        flowType: 'pkce',
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    });
    
    console.log("Attempting to exchange code for session");
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error("Auth exchange error:", error.message, error);
      return NextResponse.redirect(`${requestUrl.origin}/auth/login?error=auth_failed&details=${encodeURIComponent(error.message)}`);
    }

    if (data.session) {
      console.log("Session created successfully");
      return NextResponse.redirect(`${requestUrl.origin}/`);
    } else {
      console.log("No session in response data");
      return NextResponse.redirect(`${requestUrl.origin}/auth/login?error=no_session`);
    }

  } catch (error) {
    console.error("Callback error:", error);
    return NextResponse.redirect(`https://social-media-app-jade-three.vercel.app/auth/login?error=server_error`);
  }
}