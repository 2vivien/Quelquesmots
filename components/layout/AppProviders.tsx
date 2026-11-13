"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { Toaster } from "sonner";
import { AuthPopup } from "@/features/auth/components/AuthPopup";

/**
 * Fournisseur global TanStack Query et notifications toast Sonner.
 * @param props Enfants de l'application.
 */
export function AppProviders({ children }: { children: React.ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: { queries: { staleTime: 30_000, refetchOnWindowFocus: false } },
      }),
  );
  return (
    <QueryClientProvider client={client}>
      {children}
      <AuthPopup />
      <Toaster position="bottom-center" />
    </QueryClientProvider>
  );
}
