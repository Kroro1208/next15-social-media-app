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
        console.log("Current pathname:", window.location.pathname);

        // Allow initialization even on the callback page so the client can
        // detect session from URL fragments or PKCE code exchange.

        // URLフラグメントからセッションを取得する場合
        if (
          typeof window !== "undefined" &&
          window.location.hash &&
          !window.location.pathname.includes("/auth/callback")
        ) {
          console.log(
            "URL has hash (not in callback), attempting to get session from URL",
          );
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
        } catch (error: unknown) {
          console.error("Error setting cookies:", error);
        }
      } else if (event === "SIGNED_OUT") {
        try {
          await fetch("/api/auth/clear-cookies", {
            method: "POST",
          });
        } catch (error: unknown) {
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
        } catch (error: unknown) {
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
      // PKCEフローではクライアントサイドで完結させる
      const redirectUrl = `${window.location.origin}/auth/login`;

      console.log("=== Google Auth Debug ===");
      console.log("Redirect URL:", redirectUrl);

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      });

      console.log("OAuth response:", { data, error });

      if (error) {
        console.error("Google sign in error:", error);
        throw error;
      }
    } catch (error) {
      console.error("Google sign in error:", error);
      throw error;
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
      } catch (error: unknown) {
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
      } catch (error: unknown) {
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
    } catch (error: unknown) {
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
