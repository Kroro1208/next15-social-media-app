"use client";

import { useAuth } from "../hooks/useAuth";
import { PageLoadingSpinner } from "./ui/LoadingSpinner";

interface AuthGuardProps {
  children: React.ReactNode;
}

export const AuthGuard = ({ children }: AuthGuardProps) => {
  const { loading } = useAuth();

  // 認証ローディング中はオーバーレイ表示
  if (loading) {
    return (
      <>
        {children}
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Blur背景 */}
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm transition-all duration-300" />

          {/* ローディングスピナー */}
          <div className="relative z-10">
            <PageLoadingSpinner text="認証確認中..." />
          </div>
        </div>
      </>
    );
  }

  return <>{children}</>;
};
