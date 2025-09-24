import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const supabaseUrl = process.env["SUPABASE_URL"]!;
    const supabaseAnonKey = process.env["SUPABASE_ANON_KEY"]!;

    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get("code");
    const error = searchParams.get("error");
    const state = searchParams.get("state");

    // デバッグ情報をログ出力
    console.log("=== Auth Callback Debug Info ===");
    console.log("Request URL:", request.url);
    console.log("Origin:", origin);
    console.log("Code:", code ? "present" : "missing");
    console.log("Error:", error);
    console.log("State:", state);
    console.log("All search params:", Array.from(searchParams.entries()));

    // OAuth エラーがある場合
    if (error) {
      console.log(`OAuth error: ${error}`);
      return NextResponse.redirect(`${origin}/auth/login?error=${error}`);
    }

    // code パラメータがない場合
    if (!code) {
      console.log("No code parameter received");
      console.log("Available params:", Array.from(searchParams.entries()));
      return NextResponse.redirect(
        `${origin}/auth/login?error=no_code&debug=missing_code_param`,
      );
    }

    // Supabase クライアント作成
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // 認証コード交換
    const { data, error: exchangeError } =
      await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError) {
      console.error("Code exchange failed:", exchangeError);
      return NextResponse.redirect(
        `${origin}/auth/login?error=exchange_failed`,
      );
    }

    if (!data.session) {
      console.error("No session received after code exchange");
      return NextResponse.redirect(`${origin}/auth/login?error=no_session`);
    }

    console.log("Authentication successful");
    return NextResponse.redirect(`${origin}/dashboard`);
  } catch (error) {
    console.error("Auth callback error:", error);
    const { origin } = new URL(request.url);
    return NextResponse.redirect(`${origin}/auth/login?error=callback_failed`);
  }
}
