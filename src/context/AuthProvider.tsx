"use client";
import type { User } from "@supabase/supabase-js";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "../supabase-client";
import { AuthContext } from "./AuthContext";
export interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => void;
  signInWithEmail: (
    email: string,
    password: string,
  ) => Promise<{ error?: string }>;
  signUpWithEmail: (
    email: string,
    password: string,
  ) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
}

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        console.log("Initializing auth...");

        // URLフラグメントからセッションを取得する場合
        if (typeof window !== "undefined" && window.location.hash) {
          console.log("URL has hash, attempting to get session from URL");
          const { data, error } = await supabase.auth.getSession();
          console.log("getSession result:", { data, error });
        }

        // 通常のセッション取得
        supabase.auth
          .getSession()
          .then(({ data: { session }, error }) => {
            console.log("Session check result:", {
              session: session?.user?.email,
              error,
            });
            if (error && !error.message.includes("Refresh Token Not Found")) {
              console.error("Error getting session:", error);
              setUser(null);
              setLoading(false);
              return;
            }
            setUser(session?.user ?? null);
            setLoading(false); // 認証チェック完了後にloading終了

            // httpOnly Cookie更新（バックグラウンド）
            if (session?.access_token && session?.refresh_token) {
              fetch("/api/auth/set-cookies", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  access_token: session.access_token,
                  refresh_token: session.refresh_token,
                }),
              }).catch((error) => {
                console.error(
                  "Error setting cookies during initialization:",
                  error,
                );
              });
            }
          })
          .catch(() => {
            setUser(null);
            setLoading(false);
          });
      } catch {
        setUser(null);
        setLoading(false);
      }
    };

    initializeAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      // 認証状態変更時は常にユーザー状態を更新
      setUser(session?.user ?? null);

      if (event === "SIGNED_IN" && session) {
        try {
          const response = await fetch("/api/auth/set-cookies", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              access_token: session.access_token,
              refresh_token: session.refresh_token,
            }),
          });

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
        } catch (error) {
          console.error("Error setting cookies:", error);
        }
      } else if (event === "SIGNED_OUT") {
        try {
          await fetch("/api/auth/clear-cookies", {
            method: "POST",
          });
        } catch (error) {
          console.error("Error clearing cookies:", error);
        }
      } else if (event === "TOKEN_REFRESHED" && session) {
        // Update cookies when tokens are refreshed
        try {
          const response = await fetch("/api/auth/set-cookies", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              access_token: session.access_token,
              refresh_token: session.refresh_token,
            }),
          });

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
        } catch (error) {
          console.error("Error updating cookies:", error);
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signInWithGoogle = useCallback(async () => {
    try {
      console.log("=== Google OAuth Debug ===");
      console.log("Current URL:", window.location.href);
      console.log("Origin:", window.location.origin);
      console.log(
        "Redirect URL will be:",
        `${window.location.origin}/auth/callback`,
      );

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      console.log("OAuth result:", { data, error });

      if (data?.url) {
        console.log("Supabase OAuth URL:", data.url);
        // OAuth URLを解析して設定を確認
        try {
          const oauthUrl = new URL(data.url);
          console.log("OAuth URL host:", oauthUrl.host);
          console.log(
            "OAuth URL search params:",
            Object.fromEntries(oauthUrl.searchParams.entries()),
          );
        } catch (e) {
          console.log("Failed to parse OAuth URL:", e);
        }
      }

      if (error) {
        console.error("Google sign in error:", error);
        alert(`認証エラー: ${error.message}`);
      } else {
        console.log("OAuth redirect initiated successfully");
        console.log("Data:", data);

        // 一時的にリダイレクトを止めてURLを確認
        if (data?.url) {
          const shouldProceed = confirm(
            `OAuth URL: ${data.url}\n\nこのURLで認証を続行しますか？`,
          );
          if (shouldProceed) {
            window.location.href = data.url;
          }
          return; // 自動リダイレクトを防ぐ
        }
      }
    } catch (error) {
      console.error("Sign in error:", error);
      alert(
        `エラー: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }, []);

  const signInWithEmail = useCallback(
    async (email: string, password: string) => {
      try {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) {
          console.error("Email sign in error:", error);
          return { error: error.message };
        }
        return {};
      } catch (error) {
        console.error("Sign in error:", error);
        return { error: "サインインエラーが発生しました" };
      }
    },
    [],
  );

  const signUpWithEmail = useCallback(
    async (email: string, password: string) => {
      try {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });
        if (error) {
          console.error("Email sign up error:", error);
          return { error: error.message };
        }
        return {};
      } catch (error) {
        console.error("Sign up error:", error);
        return { error: "サインアップエラーが発生しました" };
      }
    },
    [],
  );

  const signOut = useCallback(async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("Sign out error:", error);
      }
    } catch (error) {
      console.error("Sign out error:", error);
    }
  }, []);

  const contextValue = useMemo(
    () => ({
      user,
      loading,
      signInWithGoogle,
      signInWithEmail,
      signUpWithEmail,
      signOut,
    }),
    [
      user,
      loading,
      signInWithGoogle,
      signInWithEmail,
      signUpWithEmail,
      signOut,
    ],
  );

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};
