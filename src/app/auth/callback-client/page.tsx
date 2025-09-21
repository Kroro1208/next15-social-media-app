"use client";

import { supabase } from "@/supabase-client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function CallbackClientPage() {
  const router = useRouter();
  const [status, setStatus] = useState("処理中...");

  useEffect(() => {
    (async () => {
      try {
        setStatus("認証情報を検証しています...");

        // Supabase client の detectSessionInUrl が true であれば
        // クライアント初期化時に URL の hash や query を検出して
        // セッションを復元する処理が走るはずです。
        // ただしここでは明示的に getSession() を呼んでセッション存在を確認します。

        // Wait a short moment to allow supabase client to process the URL if it does so automatically
        await new Promise((r) => setTimeout(r, 300));

        const { data, error } = await supabase.auth.getSession();

        if (error) {
          console.error("Error getting session on callback-client:", error);
        }

        if (data?.session) {
          console.log(
            "Session recovered on client callback, redirecting to home",
          );
          // Optionally, set cookies via API to keep httpOnly session in sync
          try {
            await fetch("/api/auth/set-cookies", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                access_token: data.session.access_token,
                refresh_token: data.session.refresh_token,
              }),
            });
          } catch (e) {
            console.error("Failed to set cookies after client callback:", e);
          }

          router.replace("/");
          return;
        }

        // If we didn't get a session, try to let supabase detect session directly from URL.
        // Supabase has internal methods for parsing the URL fragment; if that doesn't work
        // we fall back to showing an error.
        setStatus("URL を解析しています...");

        // Try to explicitly parse session from URL if available
        try {
          // Many providers may return tokens in the URL fragment (hash) like
          // #access_token=...&refresh_token=...; parse that and set session.
          if (typeof window !== "undefined" && window.location.hash) {
            const hash = window.location.hash.replace(/^#/, "");
            const params = new URLSearchParams(hash);
            const access_token = params.get("access_token");
            const refresh_token = params.get("refresh_token");

            if (access_token && refresh_token) {
              console.log(
                "Found tokens in hash, setting session via supabase.auth.setSession",
              );
              const { data: setData, error: setError } =
                await supabase.auth.setSession({
                  access_token,
                  refresh_token,
                });

              if (setError) {
                console.error("Error setting session from hash:", setError);
              }

              if (setData?.session) {
                try {
                  await fetch("/api/auth/set-cookies", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      access_token: setData.session.access_token,
                      refresh_token: setData.session.refresh_token,
                    }),
                  });
                } catch (e) {
                  console.error("Failed to set cookies after setSession:", e);
                }
                router.replace("/");
                return;
              }
            }
          }
        } catch (err) {
          console.warn("Failed to parse hash or set session:", err);
        }

        // 最後のフォールバック: 認証コードもフラグメントもない -> ログインに戻す
        setStatus("認証情報が見つかりません。ログイン画面に戻ります...");
        setTimeout(() => {
          router.replace("/auth/login?error=no_code");
        }, 1200);
      } catch (err) {
        console.error("Unexpected error in callback-client:", err);
        router.replace("/auth/login?error=server_error");
      }
    })();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="p-6 rounded shadow bg-white dark:bg-gray-800">
        <p className="text-center">{status}</p>
      </div>
    </div>
  );
}
