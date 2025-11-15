"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Provider as JotaiProvider } from "jotai";
import dynamic from "next/dynamic";
import { type ReactNode, useMemo, useState } from "react";
import { AuthProvider } from "../../context/AuthProvider";
import { LanguageProvider } from "../../context/LanguageProvider";
import { ThemeProvider } from "../../context/ThemeProvider";

const ToastContainer = dynamic(
  () =>
    import("react-toastify").then((mod) => ({
      default: mod.ToastContainer,
    })),
  {
    ssr: false,
    loading: () => null,
  },
);

interface ClientProvidersProps {
  children: ReactNode;
}

export default function ClientProviders({ children }: ClientProvidersProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: 0,
            refetchOnWindowFocus: false,
            staleTime: 60 * 1000,
            gcTime: 5 * 60 * 1000,
            networkMode: "offlineFirst",
          },
          mutations: {
            retry: 0,
            networkMode: "offlineFirst",
          },
        },
      }),
  );

  const providers = useMemo(
    () => (
      <ThemeProvider>
        <LanguageProvider>
          <AuthProvider>{children}</AuthProvider>
        </LanguageProvider>
      </ThemeProvider>
    ),
    [children],
  );

  return (
    <JotaiProvider>
      <QueryClientProvider client={queryClient}>
        {providers}
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="dark"
        />
      </QueryClientProvider>
    </JotaiProvider>
  );
}
