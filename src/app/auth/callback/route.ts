import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { origin, searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const error = searchParams.get("error");
    const error_description = searchParams.get("error_description");

    // エラーがある場合はログインページにリダイレクト
    if (error) {
      console.error("OAuth error received:", error, error_description);
      return NextResponse.redirect(
        `${origin}/auth/login?error=${error}&message=${encodeURIComponent(error_description || "")}`,
      );
    }

    // 認証コードがない場合はエラー
    if (!code) {
      console.error("No code found in callback URL");
      return NextResponse.redirect(`${origin}/auth/login?error=no_code`);
    }

    // サーバーサイドSupabaseクライアント作成
    const supabaseUrl = process.env["NEXT_PUBLIC_SUPABASE_URL"];
    const supabaseAnonKey = process.env["NEXT_PUBLIC_SUPABASE_ANON_KEY"];

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error("Missing Supabase environment variables");
      return NextResponse.redirect(`${origin}/auth/login?error=server_config`);
    }

    const cookieStore = await cookies();
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // クッキー設定エラーは無視（middleware等でのエラー回避）
          }
        },
      },
    });

    // PKCEフロー: 認証コードをセッションに交換
    const { data, error: exchangeError } =
      await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError) {
      console.error("Error exchanging code for session:", exchangeError);
      return NextResponse.redirect(
        `${origin}/auth/login?error=exchange_failed&message=${encodeURIComponent(exchangeError.message)}`,
      );
    }

    if (!data?.session) {
      console.error("No session returned after code exchange");
      return NextResponse.redirect(`${origin}/auth/login?error=no_session`);
    }

    console.log("Successfully exchanged code for session");

    // ホームページにリダイレクト
    return NextResponse.redirect(origin);
  } catch (error) {
    console.error("Callback error:", error);
    const { origin } = new URL(request.url);
    return NextResponse.redirect(
      `${origin}/auth/login?error=callback_failed&message=${encodeURIComponent(error instanceof Error ? error.message : "Unknown error")}`,
    );
  }
}
