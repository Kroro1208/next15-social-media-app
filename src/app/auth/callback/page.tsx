"use client";

import { supabase } from "@/supabase-client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // URLからパラメータを直接取得
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get("code");

        if (code) {
          const { data, error } =
            await supabase.auth.exchangeCodeForSession(code);

          if (error) {
            console.error("Auth error:", error);
            router.push(
              "/auth/login?error=" + encodeURIComponent(error.message),
            );
            return;
          }

          if (data.session) {
            router.push("/");
            return;
          }
        }

        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          console.error("Session error:", error);
          router.push("/auth/login?error=" + encodeURIComponent(error.message));
          return;
        }

        if (session) {
          router.push("/");
        } else {
          router.push("/auth/login");
        }
      } catch (error) {
        console.error("Unexpected error:", error);
        router.push("/auth/login");
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
