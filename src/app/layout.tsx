import { Suspense } from "react";

import "react-toastify/dist/ReactToastify.css";
import { TokenCleanup } from "../components/TokenCleanup";
import "../index.css";
import { PageTransitionProvider } from "../context/PageTransitionContext";
import { AuthGuard } from "./components/AuthGuard";
import ClientProviders from "./components/ClientProviders";
import Navbar from "./components/Navbar";
import { PageTransitionOverlay } from "./components/PageTransitionOverlay";
import { OverlayLoadingSpinner } from "./components/ui/LoadingSpinner";
import { metadata } from "./metadata";

export { metadata };

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja" className="bg-white dark:bg-gray-900">
      <body
        suppressHydrationWarning={true}
        className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
      >
        <TokenCleanup />
        <ClientProviders>
          <PageTransitionProvider>
            <AuthGuard>
              <div className="min-h-screen bg-background text-foreground transition-all duration-700 pt-20">
                {/* Issue #73: Navbarを独立したSuspense境界に分離 */}
                <Suspense
                  fallback={
                    <nav className="fixed top-0 w-full z-40 bg-[rgba(10,10,10,0.8)] backdrop-blur-lg border-b border-white/10 shadow-lg">
                      <div className="ml-64">
                        <div className="max-w-7xl mx-auto">
                          <div className="flex items-center justify-between h-16 pr-6">
                            <div className="text-gray-300">Loading...</div>
                          </div>
                        </div>
                      </div>
                    </nav>
                  }
                >
                  <Navbar />
                </Suspense>

                <div className="container mx-auto px-4 py-6">
                  {/* コンテンツ専用のSuspense境界 - オーバーレイ形式 */}
                  <Suspense
                    fallback={
                      <OverlayLoadingSpinner text="ページを読み込み中..." />
                    }
                  >
                    {children}
                  </Suspense>
                </div>
              </div>

              {/* ページ遷移オーバーレイ */}
              <PageTransitionOverlay />
            </AuthGuard>
          </PageTransitionProvider>
        </ClientProviders>
      </body>
    </html>
  );
}
