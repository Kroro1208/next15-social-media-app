"use client";

import { supabase } from "@/supabase-client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          router.push("/auth/login?error=auth_failed");
          return;
        }

        if (data.session) {
          router.push("/");
        } else {
          router.push("/auth/login?error=no_session");
        }
      } catch (error) {
        router.push("/auth/login?error=callback_failed");
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
