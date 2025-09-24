import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams, origin } = new URL(request.url);

    // すべてのパラメータを確認
    const allParams = Object.fromEntries(searchParams.entries());

    // 一時的にすべての情報をエラーページに表示
    const debugInfo = encodeURIComponent(
      JSON.stringify({
        url: request.url,
        params: allParams,
        hasCode: !!searchParams.get("code"),
        hasError: !!searchParams.get("error"),
      }),
    );

    return NextResponse.redirect(
      `${origin}/auth/login?error=debug&info=${debugInfo}`,
    );
  } catch (error) {
    console.error("Auth callback error:", error);
    const { origin } = new URL(request.url);
    return NextResponse.redirect(`${origin}/auth/login?error=callback_failed`);
  }
}
