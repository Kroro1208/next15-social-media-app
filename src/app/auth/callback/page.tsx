"use client";

import { supabase } from "@/supabase-client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AuthCallback() {
  const router = useRouter();

  // ページレンダリング時にもアラートを表示
  if (typeof window !== "undefined") {
    console.log("CALLBACK PAGE RENDERING");
    // アラートも確実に表示
    setTimeout(() => alert("CALLBACK PAGE RENDERING"), 100);
  }

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        alert("AUTH CALLBACK PAGE LOADED"); // 強制的にアラート表示
        console.log("=== CALLBACK PAGE EXECUTING ===");
        console.log("Current URL:", window.location.href);
        console.log("Search params:", window.location.search);
        console.log("Hash:", window.location.hash);

        // URLハッシュからトークンを手動で抽出
        const hashParams = new URLSearchParams(
          window.location.hash.substring(1),
        );
        const accessToken = hashParams.get("access_token");
        const refreshToken = hashParams.get("refresh_token");
        const hashError = hashParams.get("error");
        const hashErrorDescription = hashParams.get("error_description");

        // URLクエリパラメータからも確認
        const searchParams = new URLSearchParams(window.location.search);
        const code = searchParams.get("code");
        const searchError = searchParams.get("error");
        const searchErrorDescription = searchParams.get("error_description");

        console.log("Found tokens:", {
          accessToken: !!accessToken,
          refreshToken: !!refreshToken,
          code: !!code,
          hashError,
          hashErrorDescription,
          searchError,
          searchErrorDescription,
        });

        // エラーがある場合は処理
        if (hashError || searchError) {
          const errorMsg =
            hashErrorDescription ||
            searchErrorDescription ||
            hashError ||
            searchError;
          console.error("Auth redirect error:", errorMsg);
          router.push(
            "/auth/login?error=" + encodeURIComponent(errorMsg as string),
          );
          return;
        }

        if (accessToken && refreshToken) {
          // トークンベースの認証
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (error) {
            console.error("Token auth error:", error);
            router.push(
              "/auth/login?error=" + encodeURIComponent(error.message),
            );
            return;
          }

          if (data?.session) {
            console.log("Session created from tokens, redirecting to home");
            router.push("/");
            return;
          }
        } else if (code) {
          // PKCEコードベースの認証
          const { data, error } =
            await supabase.auth.exchangeCodeForSession(code);

          if (error) {
            console.error("Code exchange error:", error);
            router.push(
              "/auth/login?error=" + encodeURIComponent(error.message),
            );
            return;
          }

          if (data?.session) {
            console.log("Session created from code, redirecting to home");
            router.push("/");
            return;
          }
        }

        // 既存のセッションをチェック
        const { error } = await supabase.auth.getSession();

        if (error) {
          console.error("Auth error:", error);
          router.push("/auth/login?error=" + encodeURIComponent(error.message));
          return;
        }

        // 認証状態の変更を監視
        const {
          data: { subscription },
        } = supabase.auth.onAuthStateChange(async (event, session) => {
          console.log("Auth state changed:", event, session);

          if (event === "SIGNED_IN" && session) {
            console.log("User signed in, redirecting to home");
            subscription.unsubscribe();
            router.push("/");
            return;
          }

          if (event === "SIGNED_OUT") {
            console.log("User signed out, redirecting to login");
            subscription.unsubscribe();
            router.push("/auth/login");
            return;
          }
        });

        // 一定時間後にタイムアウト
        setTimeout(() => {
          console.log("Auth timeout, checking session one more time");
          supabase.auth.getSession().then(({ data, error }) => {
            subscription.unsubscribe();

            if (error) {
              console.error("Final session check error:", error);
              router.push(
                "/auth/login?error=" + encodeURIComponent(error.message),
              );
              return;
            }

            if (data?.session) {
              console.log("Session found in final check");
              router.push("/");
            } else {
              console.log("No session in final check");
              router.push("/auth/login?error=timeout");
            }
          });
        }, 5000);
      } catch (error) {
        console.error("Unexpected error:", error);
        router.push("/auth/login?error=unexpected_error");
      }
    };

    handleAuthCallback();
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p>認証処理中...</p>
      </div>
    </div>
  );
}
