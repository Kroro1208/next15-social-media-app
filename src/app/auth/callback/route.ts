import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get("code");
    const error = requestUrl.searchParams.get("error");

    console.log("Auth callback:", { 
      hasCode: !!code, 
      hasError: !!error,
      origin: requestUrl.origin
    });

    // OAuth認証エラーがある場合
    if (error) {
      console.error("OAuth error:", error);
      return NextResponse.redirect(`${requestUrl.origin}/auth/login?error=oauth_failed`);
    }

    // 認証コードがない場合
    if (!code) {
      console.error("No authorization code received");
      return NextResponse.redirect(`${requestUrl.origin}/auth/login?error=no_code`);
    }

    // 環境変数チェック
    const supabaseUrl = process.env["NEXT_PUBLIC_SUPABASE_URL"];
    const supabaseAnonKey = process.env["NEXT_PUBLIC_SUPABASE_ANON_KEY"];

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error("Missing Supabase environment variables");
      return NextResponse.redirect(`${requestUrl.origin}/auth/login?error=config_error`);
    }

    // Supabaseクライアント作成
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // 認証コードをセッションに交換
    const { data, error: sessionError } = await supabase.auth.exchangeCodeForSession(code);

    if (sessionError) {
      console.error("Session exchange error:", sessionError.message);
      return NextResponse.redirect(`${requestUrl.origin}/auth/login?error=session_failed`);
    }

    if (!data.session) {
      console.error("No session created");
      return NextResponse.redirect(`${requestUrl.origin}/auth/login?error=no_session`);
    }

    console.log("Auth success, redirecting to home");
    return NextResponse.redirect(`${requestUrl.origin}/`);

  } catch (error) {
    console.error("Auth callback error:", error);
    const origin = process.env.NODE_ENV === 'production' 
      ? 'https://social-media-app-jade-three.vercel.app' 
      : 'http://localhost:3000';
    return NextResponse.redirect(`${origin}/auth/login?error=unexpected_error`);
  }
}