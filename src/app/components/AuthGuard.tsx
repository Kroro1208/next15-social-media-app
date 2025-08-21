"use client";

import { useAuth } from "../hooks/useAuth";
import { OverlayLoadingSpinner } from "./ui/LoadingSpinner";

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
        <OverlayLoadingSpinner text="認証確認中..." zIndex="z-50" />
      </>
    );
  }

  return <>{children}</>;
};
