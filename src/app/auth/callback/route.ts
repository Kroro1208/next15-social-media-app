import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get("code");

    if (!code) {
      return NextResponse.redirect(`${requestUrl.origin}/auth/login?error=no_code`);
    }

    const supabaseUrl = process.env["NEXT_PUBLIC_SUPABASE_URL"];
    const supabaseKey = process.env["NEXT_PUBLIC_SUPABASE_ANON_KEY"];

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.redirect(`${requestUrl.origin}/auth/login?error=config_error`);
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error("Auth error:", error.message);
      return NextResponse.redirect(`${requestUrl.origin}/auth/login?error=auth_failed`);
    }

    if (data.session) {
      // 認証成功 - ホームページにリダイレクト
      return NextResponse.redirect(`${requestUrl.origin}/`);
    } else {
      return NextResponse.redirect(`${requestUrl.origin}/auth/login?error=no_session`);
    }

  } catch (error) {
    console.error("Callback error:", error);
    return NextResponse.redirect(`https://social-media-app-jade-three.vercel.app/auth/login?error=server_error`);
  }
}