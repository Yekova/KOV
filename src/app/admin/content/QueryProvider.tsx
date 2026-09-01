"use client";

import { useState, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";

export function QueryProvider({ children }: { children: ReactNode }) {
  const [client] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={client}>
      {children}
      <Toaster
        theme="dark"
        toastOptions={{
          style: {
            background: "var(--kov-graphite)",
            border: "1px solid var(--kov-border)",
            color: "var(--kov-bone)",
          },
        }}
      />
    </QueryClientProvider>
  );
}
