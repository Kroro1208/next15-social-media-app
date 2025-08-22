import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const error = requestUrl.searchParams.get("error");

  console.log("Auth callback called:", { 
    url: requestUrl.href, 
    code: code ? "present" : "missing", 
    error,
    origin: requestUrl.origin 
  });

  // エラーパラメータがある場合（OAuth認証が拒否された等）
  if (error) {
    console.error("Auth callback: OAuth error:", error);
    return NextResponse.redirect(
      `${requestUrl.origin}/auth/login?error=oauth_error&message=${error}`,
    );
  }

  // 環境変数の確認
  const supabaseUrl = process.env["NEXT_PUBLIC_SUPABASE_URL"];
  const supabaseAnonKey = process.env["NEXT_PUBLIC_SUPABASE_ANON_KEY"];

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Missing Supabase environment variables");
    return NextResponse.redirect(
      `${requestUrl.origin}/auth/login?error=server_config_error`,
    );
  }

  // PKCEフローではcodeパラメータが必要
  if (code) {
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        flowType: "pkce",
        autoRefreshToken: true,
        persistSession: true,
      },
    });

    try {
      console.log("Attempting to exchange code for session...");
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);

      if (error) {
        console.error("Auth callback error:", {
          message: error.message,
          status: error.status,
          details: error,
        });
        return NextResponse.redirect(
          `${requestUrl.origin}/auth/login?error=callback_failed&details=${encodeURIComponent(error.message)}`,
        );
      }

      console.log("Auth callback success:", { 
        user: data.user?.id, 
        session: data.session ? "present" : "missing" 
      });

      // 成功時はホームページにリダイレクト
      return NextResponse.redirect(`${requestUrl.origin}/`);
    } catch (error) {
      console.error("Auth callback unexpected error:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      return NextResponse.redirect(
        `${requestUrl.origin}/auth/login?error=callback_failed&details=${encodeURIComponent(errorMessage)}`,
      );
    }
  }

  // codeがない場合はSupabaseの自動検出に任せる
  // detectSessionInUrl: true設定により自動的にフラグメントを処理
  return NextResponse.redirect(`${requestUrl.origin}/`);
}
