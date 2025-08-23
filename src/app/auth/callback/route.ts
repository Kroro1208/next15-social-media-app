import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const requestUrl = new URL(request.url);
    const oauthError = requestUrl.searchParams.get("error");
    const error_description = requestUrl.searchParams.get("error_description");

    console.log("=== OAuth Callback Debug ===");
    console.log("Full callback URL:", request.url);
    console.log("All URL parameters:", Object.fromEntries(requestUrl.searchParams.entries()));
    
    // URLフラグメント（ハッシュ）がある場合も確認
    if (requestUrl.hash) {
      console.log("URL Fragment (hash):", requestUrl.hash);
    }
    
    console.log("=== End Debug ===");

    if (oauthError) {
      console.log("OAuth error received:", oauthError, error_description);
      return NextResponse.redirect(`${requestUrl.origin}/auth/login?error=oauth_error&details=${encodeURIComponent(error_description || oauthError)}`);
    }

    // detectSessionInUrl: trueの場合、Supabaseが自動的にセッションを処理するため
    // 単純にホームページにリダイレクトする
    console.log("Redirecting to home - Supabase will handle session detection");
    return NextResponse.redirect(`${requestUrl.origin}/`);

  } catch (error) {
    console.error("Callback error:", error);
    const requestUrl = new URL(request.url);
    return NextResponse.redirect(`${requestUrl.origin}/auth/login?error=server_error`);
  }
}