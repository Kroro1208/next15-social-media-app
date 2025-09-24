import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { origin, searchParams } = new URL(request.url);
    const error = searchParams.get("error");

    // PKCEフローの場合、エラーがある場合のみ処理し、
    // 通常の認証はクライアントサイドで処理される
    if (error) {
      console.error("OAuth error received:", error);
      return NextResponse.redirect(`${origin}/auth/login?error=${error}`);
    }

    // PKCEフローでは認証情報がフラグメント（#）で渡されるため、
    // クライアントサイドで処理する必要がある
    // ここではクライアントコールバックページにリダイレクト
    return NextResponse.redirect(`${origin}/auth/callback-client`);
  } catch (error) {
    console.error("Callback error:", error);
    const { origin } = new URL(request.url);
    return NextResponse.redirect(`${origin}/auth/login?error=callback_failed`);
  }
}
